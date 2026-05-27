  import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

  const FUNCTION_NAME = 'ruumrPlusBridge';
  const DEFAULT_SERVICE_URL = 'http://127.0.0.1:8787';
  const DEFAULT_LIMIT = 1000;

  function getServiceUrl() {
      return (Deno.env.get('RUUMR_PLUS_SERVICE_URL') || DEFAULT_SERVICE_URL).trim().replace(/\/+$/, '');
  }

  function isLoopbackHostname(hostname: string) {
      const normalized = String(hostname || '').trim().toLowerCase();
      return normalized === 'localhost' || normalized === '127.0.0.1' || normalized === '::1' || normalized.endsWith('.local');
  }

  function isLocalRequest(req: Request) {
      try {
          const { hostname } = new URL(req.url);
          return isLoopbackHostname(hostname);
      } catch {
          return false;
      }
  }

  function isLoopbackServiceUrl(serviceUrl: string) {
      try {
          const { hostname } = new URL(serviceUrl);
          return isLoopbackHostname(hostname);
      } catch {
          return false;
      }
  }

  function getApiKey() {
      const value = (Deno.env.get('RUUMR_PLUS_API_KEY') || '').trim();
      return value && value !== 'replace-me' ? value : null;
  }

  function getWebhookSecret() {
      const value = (Deno.env.get('RUUMR_PLUS_WEBHOOK_SECRET') || '').trim();
      return value && value !== 'replace-me' ? value : null;
  }

  function cleanObject(value: Record<string, unknown>) {
      return Object.fromEntries(
          Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== null)
      );
  }

  function normalizeCityValues(value: unknown) {
      const values = Array.isArray(value) ? value.flat(Infinity) : value == null ? [] : [value];
      const seen = new Set<string>();
      const result: string[] = [];

      for (const entry of values) {
          const parts = String(entry ?? '')
              .split(/[,\n\r|]+/g)
              .map((part) => part.trim())
              .filter(Boolean);

          for (const city of parts) {
              const key = city.toLowerCase();
              if (seen.has(key)) {
                  continue;
              }

              seen.add(key);
              result.push(city);
          }
      }

      return result;
  }

  function makeEventId(prefix: string, userId: string) {
      return `${prefix}_${userId}_${Date.now()}_${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`;
  }

  function makeIdempotencyKey(prefix: string, userId: string) {
      return `${prefix}:${userId}:${Date.now()}:${crypto.randomUUID().slice(0, 8)}`;
  }

  async function signBody(rawBody: string, secret: string | null) {
      if (!secret) {
          return null;
      }

      const key = await crypto.subtle.importKey(
          'raw',
          new TextEncoder().encode(secret),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign'],
      );
  
      const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
      return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  async function serviceRequest(req: Request, path: string, {
      method = 'POST',
      body = null,
      requireAuth = false,
      signWebhook = false,
  }: {
      method?: string;
      body?: Record<string, unknown> | null;
      requireAuth?: boolean;
      signWebhook?: boolean;
  } = {}) {
      const serviceUrl = getServiceUrl();
      const apiKey = getApiKey();
      const secret = getWebhookSecret();
      const rawBody = body ? JSON.stringify(body) : null;
      const headers: Record<string, string> = {};
  
      if (!isLocalRequest(req) && isLoopbackServiceUrl(serviceUrl)) {
          throw new Error(
              'RUUMR_PLUS_SERVICE_URL is still pointing to localhost. Set it to the deployed ruumr-plus-service URL in Base44 before deploying ruumr.'
          );
      }

      if (rawBody) {
          headers['Content-Type'] = 'application/json';
      }

      if (requireAuth && apiKey) {
          headers.Authorization = `Bearer ${apiKey}`;
      }

      if (signWebhook && rawBody && secret) {
          const signature = await signBody(rawBody, secret);
          if (signature) {
              headers['x-ruumr-signature'] = signature;
          }
      }

      const response = await fetch(`${serviceUrl}${path}`, {
          method,
          headers,
          body: rawBody ?? undefined,
      });

      const text = await response.text();
      let json: unknown = null;
      if (text) {
          try {
              json = JSON.parse(text);
          } catch {
              json = text;
          }
      }
  
      if (!response.ok) {
          const error = new Error(`Ruumr Plus request to ${path} failed with status ${response.status}`);
          (error as Error & { status?: number; payload?: unknown }).status = response.status;
          (error as Error & { status?: number; payload?: unknown }).payload = json;
          throw error;
      }

      return json;
  }

  // Service-role user listing. The user-context client cannot list the built-in
  // User entity (Base44 restricts that to project collaborators), so admin tools
  // must read it through the service role here. Paginate through the full set so
  // every user is returned regardless of count — a single list() call is capped.
  async function searchUsers(base44: ReturnType<typeof createClientFromRequest>, body: Record<string, unknown>) {
      const maxUsers = Math.min(Number(body.limit) || 20000, 50000);
      const pageSize = 500;
      const collected: Record<string, unknown>[] = [];
      let skip = 0;

      while (collected.length < maxUsers) {
          const page = await base44.asServiceRole.entities.User.list('-created_date', pageSize, skip);
          const batch = Array.isArray(page) ? page : [];
          collected.push(...batch);

          if (batch.length < pageSize) {
              break;
          }

          skip += pageSize;
      }

      const list = collected.map((user: Record<string, unknown>) => ({
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          is_ruumr_plus: Boolean(user.is_ruumr_plus),
          disabled: Boolean(user.disabled),
      }));
      return { users: list, total: list.length };
  }

  
  // Sets the Base44 User.is_ruumr_plus flag via service role (the client cannot
  // reliably update other users). Throws on failure so the caller can surface it.
  async function setUserPlusFlag(base44: ReturnType<typeof createClientFromRequest>, userId: unknown, value: boolean) {
      const id = String(userId ?? '').trim();
      if (!id) {
          throw new Error('user_id is required to set Ruumr Plus access');
      }
      await base44.asServiceRole.entities.User.update(id, { is_ruumr_plus: value });
      return true;
  }

  async function loadCurrentUser(base44: ReturnType<typeof createClientFromRequest>) {
      const currentUser = await base44.auth.me();
      if (!currentUser) {
          throw new Error('Unauthorized');
      }
      return currentUser;
  }

  function normalizeProfile(profile: Record<string, unknown>) {
      const searchCities = normalizeCityValues(profile.search_cities);
      const locationCities = normalizeCityValues(profile.location);
      const normalizedSearchCities = normalizeCityValues([...searchCities, ...locationCities]);

      return cleanObject({
          user_id: profile.user_id,
          name: profile.name,
          age: profile.age,
          gender: profile.gender,
          location: normalizedSearchCities[0] ?? profile.location,
          search_cities: normalizedSearchCities,
          search_area: profile.search_area,
          budget_min: profile.budget_min,
          budget_max: profile.budget_max,
          vibe_level: profile.vibe_level,
          smoking_preference: profile.smoking_preference,
          pet_preference: profile.pet_preference,
          pet_type: profile.pet_type,
          pet_other_description: profile.pet_other_description,
          looking_for_gender: profile.looking_for_gender,
          religion: profile.religion,
          kosher_preference: profile.kosher_preference,
          shabbat_preference: profile.shabbat_preference,
          current_status: profile.current_status,
          cleanliness: profile.cleanliness,
          shopping: profile.shopping,
          ac_wars: profile.ac_wars,
          dishes_in_sink: profile.dishes_in_sink,
          friends_and_parties: profile.friends_and_parties,
          about_me: profile.about_me,
          looking_for_description: profile.looking_for_description,
          social_link: profile.social_link,
          itunes_track_id: profile.itunes_track_id,
          song_preview_url: profile.song_preview_url,
          song_name: profile.song_name,
          song_artist: profile.song_artist,
          song_image: profile.song_image,
          photos: Array.isArray(profile.photos) ? profile.photos.filter(Boolean) : profile.photos,
          apartment_photos: Array.isArray(profile.apartment_photos) ? profile.apartment_photos.filter(Boolean) : profile.apartment_photos,
          existing_roommates: profile.existing_roommates,
          apartment_total_budget: profile.apartment_total_budget,
          interests: Array.isArray(profile.interests) ? profile.interests.filter(Boolean) : profile.interests,
          team_members: profile.team_members,
          team_target: profile.team_target,
          is_visible: profile.is_visible,
          is_verified: profile.is_verified,
          location_lat: profile.location_lat,
          location_lng: profile.location_lng,
          location_radius_km: profile.location_radius_km,
          video_url: profile.video_url,
      });
  }

  async function syncCurrentProfile(base44: ReturnType<typeof createClientFromRequest>, currentUser: Record<string, unknown>, req: Request) {
      const sr = base44.asServiceRole.entities;
      const profiles = await sr.Profile.filter({ user_id: currentUser.id });

      if (!profiles || profiles.length === 0) {
          return {
              ok: true,
              profile_found: false,
              stored: false,
          };
      }

      const profile = normalizeProfile(profiles[0]);
      const payload = cleanObject({
          event_id: makeEventId('evt_profile_upsert', String(currentUser.id)),
          event_type: 'profile.upsert',
          source: 'base44',
          user_id: String(currentUser.id),
          idempotency_key: makeIdempotencyKey('profile', String(currentUser.id)),
          occurred_at: new Date().toISOString(),
          signed_at: new Date().toISOString(),
          profile_payload: profile,
      });
  
      return serviceRequest(req, '/profile/upsert', {
          body: payload,
          signWebhook: true,
      });
  }

  async function deleteCurrentProfile(base44: ReturnType<typeof createClientFromRequest>, currentUser: Record<string, unknown>, req: Request) {
      const payload = cleanObject({
          event_id: makeEventId('evt_profile_delete', String(currentUser.id)),
          event_type: 'profile.delete',
          source: 'base44',
          user_id: String(currentUser.id),
          idempotency_key: makeIdempotencyKey('profile-delete', String(currentUser.id)),
          occurred_at: new Date().toISOString(),
          signed_at: new Date().toISOString(),
          deleted_at: new Date().toISOString(),
      });

      return serviceRequest(req, '/profile/delete', {
          body: payload,
          signWebhook: true,
      });
  }

  async function snapshotAllProfiles(base44: ReturnType<typeof createClientFromRequest>, currentUser: Record<string, unknown>, req: Request) {
      const sr = base44.asServiceRole.entities;
      const pageSize = Math.min(500, DEFAULT_LIMIT);
      const normalizedProfiles: Record<string, unknown>[] = [];
      let skip = 0;

      while (true) {
          const page = await sr.Profile.list('-created_date', pageSize, skip);
          const batch = Array.isArray(page) ? page : [];
          normalizedProfiles.push(...batch.map((profile: Record<string, unknown>) => normalizeProfile(profile)));

          if (batch.length < pageSize) {
              break;
          }

          skip += pageSize;
      }

      const payload = cleanObject({
          event_id: makeEventId('evt_profile_snapshot', String(currentUser.id)),
          event_type: 'profile.snapshot',
          source: 'base44',
          user_id: String(currentUser.id),
          activation_user_id: String(currentUser.id),
          idempotency_key: makeIdempotencyKey('snapshot', String(currentUser.id)),
          snapshot_id: `snapshot_${Date.now()}`,
          occurred_at: new Date().toISOString(),
          signed_at: new Date().toISOString(),
          replace_existing: true,
          profiles: normalizedProfiles,
          deleted_user_ids: [],
      });

      return serviceRequest(req, '/profile/snapshot', {
          body: payload,
          signWebhook: true,
      });
  }

  async function loadSwipeExclusions(base44: ReturnType<typeof createClientFromRequest>, userId: unknown) {
      const exclude: string[] = [];
      const liked: string[] = [];
  
      try {
          const swipes = await base44.asServiceRole.entities.Swipe.filter({ swiper_id: userId });
          for (const swipe of Array.isArray(swipes) ? swipes : []) {
              const swipedId = String((swipe as Record<string, unknown>)?.swiped_id ?? '').trim();
              if (!swipedId) {
                  continue;
              }
              const action = String((swipe as Record<string, unknown>)?.action ?? '').trim();
              if (action === 'like') {
                  liked.push(swipedId);
              } else if (action === 'dislike') {
                  exclude.push(swipedId);
              }
          }
      } catch (error) {
          console.error(`[${FUNCTION_NAME}] Failed to load swipes for recommendation exclusions`, error);
      }

      return { exclude_user_ids: exclude, liked_user_ids: liked };
  }

  function normalizeRecommendationBody(body: Record<string, unknown>) {
      return cleanObject({
          request_id: body.request_id || `req_${Date.now()}`,
          user_id: body.user_id,
          limit: typeof body.limit === 'number' ? body.limit : Number(body.limit || 12),
          refresh: Boolean(body.refresh),
          require_plus: body.require_plus !== false,
      });
  }
  
  async function handleAction(base44: ReturnType<typeof createClientFromRequest>, req: Request, currentUser: Record<string, unknown>, action: string, body: Record<string, unknown>) {
      switch (action) {
          case 'profile.sync_current':
              return syncCurrentProfile(base44, currentUser, req);
          case 'profile.delete_current':
              return deleteCurrentProfile(base44, currentUser, req);
          case 'profile.snapshot':
              if (currentUser.role !== 'admin') {
                  throw new Error('Admin access required for profile snapshots');
              }
              return snapshotAllProfiles(base44, currentUser, req);
          case 'recommendations': {
              const recommendationUserId = body.user_id || currentUser.id;
              const swipeExclusions = await loadSwipeExclusions(base44, recommendationUserId);
              return serviceRequest(req, '/recommendations', {
                  body: {
                      ...normalizeRecommendationBody({
                          ...body,
                          user_id: recommendationUserId,
                      }),
                      exclude_user_ids: swipeExclusions.exclude_user_ids,
                      liked_user_ids: swipeExclusions.liked_user_ids,
                  },
                  requireAuth: true,
              });
          }
          case 'admin.stats':
              if (currentUser.role !== 'admin') {
                  throw new Error('Admin access required');
              }
              return serviceRequest(req, '/admin/stats', {
                  method: 'GET',
                  requireAuth: true,
              });
          case 'admin.entitlements.list':
              if (currentUser.role !== 'admin') {
                  throw new Error('Admin access required');
              }
              return serviceRequest(req, '/admin/entitlements', {
                  method: 'GET',
                  requireAuth: true,
              });
          case 'admin.users.search':
              if (currentUser.role !== 'admin') {
                  throw new Error('Admin access required');
              }
              return searchUsers(base44, body);
          case 'admin.entitlements.grant': {
              if (currentUser.role !== 'admin') {
                  throw new Error('Admin access required');
              }
              // Server entitlement first: if it fails we throw before touching the
              // Base44 flag, so the two never drift out of sync.
              const grantResult = await serviceRequest(req, '/admin/entitlements/grant', {
                  body: cleanObject({
                      user_id: body.user_id,
                      tier: body.tier ?? 'plus',
                      granted_by: body.granted_by ?? currentUser.email ?? String(currentUser.id),
                      expires_at: body.expires_at ?? null,
                      notes: body.notes ?? null,
                  }),
                  requireAuth: true,
              });
              await setUserPlusFlag(base44, body.user_id, true);
              return { entitlement: grantResult, is_ruumr_plus: true };
          }
          case 'admin.entitlements.revoke': {
              if (currentUser.role !== 'admin') {
                  throw new Error('Admin access required');
              }
              // Clear the Base44 flag first so the client paywall re-engages even
              // if the service revoke is slow, then revoke the service entitlement.
              await setUserPlusFlag(base44, body.user_id, false);
              const revokeResult = await serviceRequest(req, '/admin/entitlements/revoke', {
                  body: cleanObject({
                      user_id: body.user_id,
                      tier: body.tier ?? 'plus',
                      granted_by: body.granted_by ?? currentUser.email ?? String(currentUser.id),
                      expires_at: body.expires_at ?? null,
                      notes: body.notes ?? null,
                  }),
                  requireAuth: true,
              });
              return { entitlement: revokeResult, is_ruumr_plus: false };
          }
          case 'admin.reindex':
              if (currentUser.role !== 'admin') {
                  throw new Error('Admin access required');
              }
              return serviceRequest(req, '/admin/reindex', {
                  body: cleanObject({
                      user_ids: Array.isArray(body.user_ids) ? body.user_ids : null,
                      force: Boolean(body.force),
                  }),
                  requireAuth: true,
              });
          case 'admin.cache.clear':
              if (currentUser.role !== 'admin') {
                  throw new Error('Admin access required');
              }
              return serviceRequest(req, '/admin/cache/clear', {
                  body: cleanObject({
                      user_id: body.user_id ?? null,
                      cache_key: body.cache_key ?? null,
                  }),
                  requireAuth: true,
              });
          case 'admin.replay':
              if (currentUser.role !== 'admin') {
                  throw new Error('Admin access required');
              }
              return serviceRequest(req, '/admin/replay', {
                  body: cleanObject({
                      dry_run: Boolean(body.dry_run),
                  }),
                  requireAuth: true,
              });
          case 'admin.events.list':
              if (currentUser.role !== 'admin') {
                  throw new Error('Admin access required');
              }
              return serviceRequest(req, `/admin/events?${new URLSearchParams(cleanObject({
                  user_id: body.user_id ?? null,
                  type: body.type ?? null,
                  limit: body.limit ?? 100,
                  include_payload: body.include_payload ? 'true' : null,
              }) as Record<string, string>).toString()}`, {
                  method: 'GET',
                  requireAuth: true,
              });
          default:
              throw new Error(`Unsupported Ruumr Plus action: ${action}`);
      }
  }

  Deno.serve(async (req) => {
      try {
          const base44 = createClientFromRequest(req);
          const currentUser = await loadCurrentUser(base44);
          const body = await req.json().catch(() => ({}));
          const action = String(body.action || '').trim();

          if (!action) {
              return Response.json({ ok: false, error: 'action_required' }, { status: 400 });
          }

          if (action === 'profile.sync_current' || action === 'profile.delete_current') {
              const result = await handleAction(base44, req, currentUser, action, body);
              return Response.json({ ok: true, action, result });
          }

          if (action === 'profile.snapshot' && currentUser.role !== 'admin') {
              return Response.json({ ok: false, error: 'admin_access_required' }, { status: 403 });
          }

          const result = await handleAction(base44, req, currentUser, action, body);
          return Response.json({ ok: true, action, result });
      } catch (error) {
          console.error(`[${FUNCTION_NAME}]`, error);

          const caughtError = error instanceof Error ? error : new Error(String(error));
          const status = String((caughtError as Error & { status?: number }).status || '').trim();
          const responseStatus = Number(status) || (caughtError.message.includes('Unauthorized') ? 401 : caughtError.message.includes('Admin access required') ? 403 : 500);
          return Response.json({
              ok: false,
              error: caughtError.message || 'Unknown error',
          }, { status: responseStatus });
      }
  });