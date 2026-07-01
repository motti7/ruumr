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

  const QUESTIONNAIRE_IDS = [
      'q_smoking',
      'q_partners',
      'q_pets',
      'q_cleaning_strictness',
      'q_shopping',
      'q_dishes',
      'q_ac',
      'q_hosting',
  ];

  function normalizeQuestionnairePreference(record: Record<string, unknown> | null | undefined) {
      if (!record || typeof record !== 'object') return undefined;
      const rawAnswers = record.answers && typeof record.answers === 'object'
          ? record.answers as Record<string, unknown>
          : {};
      const answers: Record<string, string> = {};
      for (const questionId of QUESTIONNAIRE_IDS) {
          if (rawAnswers[questionId] === 'a' || rawAnswers[questionId] === 'b') {
              answers[questionId] = String(rawAnswers[questionId]);
          }
      }
      if (!QUESTIONNAIRE_IDS.every((questionId) => answers[questionId])) return undefined;
      return cleanObject({
          version: Number(record.version) || 1,
          completed_at: record.completed_at,
          source: record.source,
          source_match_id: record.source_match_id,
          answers,
      });
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
	          ruumr_plus_source: user.ruumr_plus_source ?? null,
	          ruumr_plus_subscription_id: user.ruumr_plus_subscription_id ?? null,
	          disabled: Boolean(user.disabled),
	      }));
      return { users: list, total: list.length };
  }

  
  // Sets the Base44 User.is_ruumr_plus flag via service role (the client cannot
  // reliably update other users). Throws on failure so the caller can surface it.
	  async function setUserPlusFlag(
	      base44: ReturnType<typeof createClientFromRequest>,
	      userId: unknown,
	      value: boolean,
	      source: string = 'admin_grant'
	  ) {
	      const id = String(userId ?? '').trim();
	      if (!id) {
	          throw new Error('user_id is required to set Ruumr Plus access');
	      }
	      await base44.asServiceRole.entities.User.update(id, {
	          is_ruumr_plus: value,
	          ruumr_plus_source: value ? source : 'none',
	          ...(value ? {} : { ruumr_plus_subscription_id: null }),
	      });
	      return true;
	  }

  async function loadCurrentUser(base44: ReturnType<typeof createClientFromRequest>) {
      const currentUser = await base44.auth.me();
      if (!currentUser) {
          throw new Error('Unauthorized');
      }
      return currentUser;
  }

  function normalizeProfile(profile: Record<string, unknown>, questionnairePreference?: Record<string, unknown> | null) {
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
          ruumr_plus_questionnaire: normalizeQuestionnairePreference(questionnairePreference),
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

      const preferences = await sr.QuestionnairePreference.filter({ user_id: currentUser.id });
      const preference = (Array.isArray(preferences) ? preferences : [])
          .sort((left, right) => Date.parse(String(right.completed_at || right.updated_date || '')) - Date.parse(String(left.completed_at || left.updated_date || '')))[0];
      const profile = normalizeProfile(profiles[0], preference);
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
      const preferencesByUserId = new Map<string, Record<string, unknown>>();
      let preferenceSkip = 0;
      while (true) {
          const page = await sr.QuestionnairePreference.list('-completed_at', pageSize, preferenceSkip);
          const batch = Array.isArray(page) ? page : [];
          for (const preference of batch) {
              const userId = String((preference as Record<string, unknown>).user_id || '');
              if (userId && !preferencesByUserId.has(userId)) preferencesByUserId.set(userId, preference as Record<string, unknown>);
          }
          if (batch.length < pageSize) break;
          preferenceSkip += pageSize;
      }
      let skip = 0;

      while (true) {
          const page = await sr.Profile.list('-created_date', pageSize, skip);
          const batch = Array.isArray(page) ? page : [];
          normalizedProfiles.push(...batch.map((profile: Record<string, unknown>) =>
              normalizeProfile(profile, preferencesByUserId.get(String(profile.user_id)))
          ));

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

  function resolveRecommendationUserId(
      currentUser: Record<string, unknown>,
      requestedUserId: unknown,
  ) {
      return currentUser.role === 'admin' && requestedUserId
          ? requestedUserId
          : currentUser.id;
  }

  function shouldRepairCurrentUserEntitlement(
      error: unknown,
      currentUser: Record<string, unknown>,
      recommendationUserId: unknown,
  ) {
      const status = Number((error as Error & { status?: number } | null)?.status);
      return (
          status === 403 &&
          currentUser.is_ruumr_plus === true &&
          String(recommendationUserId) === String(currentUser.id)
      );
  }

  async function requestRecommendationsWithEntitlementRepair<T>({
      requestRecommendations,
      grantEntitlement,
      currentUser,
      recommendationUserId,
      onRepair,
  }: {
      requestRecommendations: () => Promise<T>;
      grantEntitlement: () => Promise<unknown>;
      currentUser: Record<string, unknown>;
      recommendationUserId: unknown;
      onRepair?: () => void;
  }) {
      try {
          return await requestRecommendations();
      } catch (error) {
          if (!shouldRepairCurrentUserEntitlement(error, currentUser, recommendationUserId)) {
              throw error;
          }

          onRepair?.();
          await grantEntitlement();
          return requestRecommendations();
      }
  }

  function hasEmptyProfileIndex(
      recommendationResult: unknown,
      statsResult: unknown,
  ) {
      const recommendation = recommendationResult && typeof recommendationResult === 'object'
          ? recommendationResult as Record<string, unknown>
          : {};
      const stats = statsResult && typeof statsResult === 'object'
          ? statsResult as Record<string, unknown>
          : {};
      const snapshot = stats.snapshot && typeof stats.snapshot === 'object'
          ? stats.snapshot as Record<string, unknown>
          : {};

      return (
          Number(recommendation.candidate_count) === 0 &&
          Number(snapshot.profile_count) <= 1
      );
  }

  function statusError(message: string, status: number) {
      const error = new Error(message);
      (error as Error & { status?: number }).status = status;
      return error;
  }

  function recommendationIncludesTarget(recommendationResult: unknown, targetUserId: unknown) {
      const result = recommendationResult && typeof recommendationResult === 'object'
          ? recommendationResult as Record<string, unknown>
          : {};
      const recommendations = Array.isArray(result.recommendations) ? result.recommendations : [];
      const targetId = String(targetUserId ?? '').trim();

      return recommendations.some((item) => {
          const recommendation = item && typeof item === 'object'
              ? item as Record<string, unknown>
              : {};
          const profile = recommendation.profile && typeof recommendation.profile === 'object'
              ? recommendation.profile as Record<string, unknown>
              : {};
          return String(recommendation.user_id ?? profile.user_id ?? '').trim() === targetId;
      });
  }

  function resolvePlusMatchType(hasReverseLike: boolean) {
      return hasReverseLike ? 'mutual' : 'ruumr_plus';
  }

  async function createMatchFromRecommendation(
      base44: ReturnType<typeof createClientFromRequest>,
      currentUser: Record<string, unknown>,
      req: Request,
      body: Record<string, unknown>,
  ) {
      const swiperId = String(currentUser.id ?? '').trim();
      const targetUserId = String(body.target_user_id ?? '').trim();
      if (!targetUserId) {
          throw statusError('target_user_id is required', 400);
      }
      if (targetUserId === swiperId) {
          throw statusError('Cannot match with your own profile', 400);
      }

      // Verify the target against the same authoritative, cached five-profile
      // recommendation set used by activation. This must happen before writing
      // the swipe because swipes are part of the recommendation cache key.
      const swipeExclusions = await loadSwipeExclusions(base44, swiperId);
      const recommendationBody = {
          ...normalizeRecommendationBody({
              user_id: swiperId,
              limit: 5,
              refresh: false,
              require_plus: true,
          }),
          exclude_user_ids: swipeExclusions.exclude_user_ids,
          liked_user_ids: swipeExclusions.liked_user_ids,
      };
      const recommendationResult = await requestRecommendationsWithEntitlementRepair({
          requestRecommendations: () => serviceRequest(req, '/recommendations', {
              body: recommendationBody,
              requireAuth: true,
          }),
          grantEntitlement: () => grantCurrentUserServiceEntitlement(req, currentUser),
          currentUser,
          recommendationUserId: swiperId,
      });

      if (!recommendationIncludesTarget(recommendationResult, targetUserId)) {
          throw statusError('The selected profile is not in the current Ruumr Plus recommendations', 403);
      }

      const entities = base44.entities;
      const sr = base44.asServiceRole.entities;
      const [currentProfiles, targetProfiles, reverseLikes, directMatches, reverseMatches, existingSwipes] =
          await Promise.all([
              sr.Profile.filter({ user_id: swiperId }),
              sr.Profile.filter({ user_id: targetUserId }),
              entities.Swipe.filter({ swiper_id: targetUserId, swiped_id: swiperId, action: 'like' }),
              entities.Match.filter({ user1_id: swiperId, user2_id: targetUserId }),
              entities.Match.filter({ user1_id: targetUserId, user2_id: swiperId }),
              entities.Swipe.filter({ swiper_id: swiperId, swiped_id: targetUserId }),
          ]);

      const currentProfile = currentProfiles?.[0];
      const targetProfile = targetProfiles?.[0];
      if (!targetProfile) {
          throw statusError('The selected profile no longer exists', 404);
      }

      const existingSwipe = existingSwipes?.[0];
      let createdSwipeId: string | null = null;
      const previousSwipeAction = existingSwipe?.action;
      try {
          if (existingSwipe) {
              if (existingSwipe.action !== 'like') {
                  await entities.Swipe.update(existingSwipe.id, { action: 'like' });
              }
          } else {
              const swipe = await entities.Swipe.create({
                  swiper_id: swiperId,
                  swiper_name: currentProfile?.name || currentUser.full_name || '',
                  swiped_id: targetUserId,
                  swiped_name: targetProfile.name || '',
                  action: 'like',
              });
              createdSwipeId = String(swipe.id);
          }

          const existingMatch = [...(directMatches || []), ...(reverseMatches || [])][0];
          const hasReverseLike = Array.isArray(reverseLikes) && reverseLikes.length > 0;
          const matchType = resolvePlusMatchType(hasReverseLike);

          if (existingMatch) {
              if (hasReverseLike && existingMatch.match_type === 'ruumr_plus') {
                  await entities.Match.update(existingMatch.id, {
                      match_type: 'mutual',
                  });
              }
              return {
                  match: true,
                  match_id: existingMatch.id,
                  match_type: hasReverseLike ? 'mutual' : existingMatch.match_type || 'mutual',
              };
          }

          const match = await entities.Match.create({
              user1_id: swiperId,
              user2_id: targetUserId,
              user1_name: currentProfile?.name || currentUser.full_name || '',
              user2_name: targetProfile.name || '',
              status: 'active',
              match_type: matchType,
              ...(hasReverseLike ? {} : { plus_initiator_id: swiperId }),
          });
          return { match: true, match_id: match.id, match_type: matchType };
      } catch (error) {
          try {
              if (createdSwipeId) {
                  await entities.Swipe.delete(createdSwipeId);
              } else if (existingSwipe && previousSwipeAction && previousSwipeAction !== 'like') {
                  await entities.Swipe.update(existingSwipe.id, { action: previousSwipeAction });
              }
          } catch (rollbackError) {
              console.error(`[${FUNCTION_NAME}] Failed to roll back Plus swipe`, rollbackError);
          }
          throw error;
      }
  }

  async function grantCurrentUserServiceEntitlement(
      req: Request,
      currentUser: Record<string, unknown>,
  ) {
      return serviceRequest(req, '/admin/entitlements/grant', {
          body: cleanObject({
              user_id: currentUser.id,
              tier: 'plus',
              granted_by: 'base44_entitlement_repair',
              notes: 'Repaired from Base44 User.is_ruumr_plus during activation',
          }),
          requireAuth: true,
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
              // Non-admin callers may only request their own recommendations.
              const recommendationUserId = resolveRecommendationUserId(currentUser, body.user_id);
              const swipeExclusions = await loadSwipeExclusions(base44, recommendationUserId);
              const recommendationBody = {
                  ...normalizeRecommendationBody({
                      ...body,
                      user_id: recommendationUserId,
                  }),
                  language: String(body.language || 'he').toLowerCase().split('-')[0] === 'en' ? 'en' : 'he',
                  exclude_user_ids: swipeExclusions.exclude_user_ids,
                  liked_user_ids: swipeExclusions.liked_user_ids,
              };

              const recommendationResult = await requestRecommendationsWithEntitlementRepair({
                  requestRecommendations: () => serviceRequest(req, '/recommendations', {
                      body: recommendationBody,
                      requireAuth: true,
                  }),
                  grantEntitlement: () => grantCurrentUserServiceEntitlement(req, currentUser),
                  currentUser,
                  recommendationUserId,
                  onRepair: () => console.warn(
                      `[${FUNCTION_NAME}] Repairing missing Plus service entitlement for ${currentUser.id}`
                  ),
              });

              if (Number((recommendationResult as Record<string, unknown>)?.candidate_count) !== 0) {
                  return recommendationResult;
              }

              const statsResult = await serviceRequest(req, '/admin/stats', {
                  method: 'GET',
                  requireAuth: true,
              });
              if (!hasEmptyProfileIndex(recommendationResult, statsResult)) {
                  return recommendationResult;
              }

              console.warn(
                  `[${FUNCTION_NAME}] Rebuilding empty Plus profile index before retrying recommendations`
              );
              await snapshotAllProfiles(base44, currentUser, req);
              return serviceRequest(req, '/recommendations', {
                  body: {
                      ...recommendationBody,
                      refresh: true,
                  },
                  requireAuth: true,
              });
          }
          case 'match.create_from_recommendation':
              return createMatchFromRecommendation(base44, currentUser, req, body);
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
	              const entitlementSource = String(body.entitlement_source || 'admin_grant');
	              await setUserPlusFlag(base44, body.user_id, true, entitlementSource);
	              return { entitlement: grantResult, is_ruumr_plus: true, ruumr_plus_source: entitlementSource };
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
	              return { entitlement: revokeResult, is_ruumr_plus: false, ruumr_plus_source: 'none' };
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
