import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const LIFECYCLE = {
    TEAM_BUILDING: 'TEAM_BUILDING',
    APARTMENT_RANKING: 'APARTMENT_RANKING',
    APARTMENT_VIEWING: 'APARTMENT_VIEWING',
    APARTMENT_FOUND: 'APARTMENT_FOUND',
};

const PREFERENCE_POINTS = {
    amazing: 2,
    ok: 1,
};

const PREFERENCE_VALUES = ['amazing', 'ok', 'no_way'];

function apartmentFlowDemoEnabled(user, profile) {
    return Boolean(user?.is_apartment_flow_demo_user || profile?.is_apartment_flow_demo_user);
}

function apartmentFlowKilledForUser(user, profile) {
    let killSwitch = false;
    try {
        killSwitch = Deno.env.get('RUUMR_APARTMENT_FLOW_KILL_SWITCH') === 'true';
    } catch (_) {
        killSwitch = false;
    }
    return killSwitch && !apartmentFlowDemoEnabled(user, profile);
}

async function getProfile(sr, userId) {
    const ps = await sr.Profile.filter({ user_id: userId });
    return ps[0] || null;
}

async function resolveMemberUserId(sr, selfId, entry) {
    if (entry?.pending) return null;
    if (entry?.user_id) return entry.user_id;
    if (entry?.match_id) {
        const ms = await sr.Match.filter({ id: entry.match_id });
        const m = ms[0];
        if (m) return String(m.user1_id) === String(selfId) ? m.user2_id : m.user1_id;
    }
    return null;
}

async function rosterUserIds(sr, selfId, profile) {
    const ids = [String(selfId)];
    for (const entry of profile?.team_members || []) {
        const uid = await resolveMemberUserId(sr, selfId, entry);
        if (uid) ids.push(String(uid));
    }
    return [...new Set(ids)];
}

async function realTeamProfiles(sr, memberIds) {
    const profiles = [];
    for (const id of memberIds) {
        const profile = await getProfile(sr, id);
        if (profile && !profile.is_virtual && profile.user_id) {
            profiles.push(profile);
        }
    }
    return profiles;
}

function normalizeCity(city) {
    return String(city || '').trim().replace(/\s+/g, ' ');
}

function cityKey(city) {
    return normalizeCity(city).toLocaleLowerCase();
}

function profileCities(profile) {
    return (profile?.search_cities || []).map(normalizeCity).filter(Boolean);
}

function calculateCityState(profiles) {
    const cityLists = profiles.map(profileCities);
    if (cityLists.length === 0 || cityLists.some((cities) => cities.length === 0)) {
        return {
            commonCities: [],
            suggestedCities: mostSharedCities(cityLists, profiles.length),
        };
    }

    const firstList = cityLists[0];
    const otherSets = cityLists.slice(1).map((cities) => new Set(cities.map(cityKey)));
    const commonCities = firstList.filter((city, index) => {
        const key = cityKey(city);
        return firstList.findIndex((candidate) => cityKey(candidate) === key) === index
            && otherSets.every((set) => set.has(key));
    });

    return {
        commonCities,
        suggestedCities: commonCities.length ? [] : mostSharedCities(cityLists, profiles.length),
    };
}

function mostSharedCities(cityLists, memberCount) {
    const counts = new Map();
    const labels = new Map();
    for (const cities of cityLists) {
        const seen = new Set();
        for (const city of cities) {
            const key = cityKey(city);
            if (!key || seen.has(key)) continue;
            seen.add(key);
            labels.set(key, labels.get(key) || city);
            counts.set(key, (counts.get(key) || 0) + 1);
        }
    }
    return [...counts.entries()]
        .filter(([, count]) => count > 1 || memberCount <= 2)
        .sort((a, b) => b[1] - a[1] || labels.get(a[0]).localeCompare(labels.get(b[0])))
        .slice(0, 3)
        .map(([key, count]) => ({ city: labels.get(key), count }));
}

function teamKey(memberIds) {
    return [...new Set(memberIds.map(String))].sort().join('_');
}

async function getDiscoveryById(sr, discoveryId) {
    const discoveries = await sr.TeamApartmentDiscovery.filter({ id: discoveryId });
    return discoveries[0] || null;
}

function assertTeamMember(discovery, userId) {
    if (!(discovery?.member_user_ids || []).map(String).includes(String(userId))) {
        return Response.json({ error: 'Not authorized for this team apartment discovery' }, { status: 403 });
    }
    return null;
}

function serialize(discovery, extra = {}) {
    return {
        success: true,
        discovery,
        ...extra,
    };
}

function statusForLifecycle(lifecycleState, fallback = 'apartment_ranking') {
    if (lifecycleState === LIFECYCLE.APARTMENT_VIEWING) return 'apartment_viewing';
    if (lifecycleState === LIFECYCLE.APARTMENT_FOUND) return 'apartment_found';
    if (lifecycleState === LIFECYCLE.TEAM_BUILDING) return 'not_established';
    return fallback;
}

function normalizeDiscoveryState(discovery) {
    if (!discovery) return discovery;
    const lifecycleState = discovery.lifecycle_state
        || (discovery.status === 'finalized' ? LIFECYCLE.APARTMENT_VIEWING : null)
        || (discovery.status === 'apartment_found' ? LIFECYCLE.APARTMENT_FOUND : null)
        || (discovery.status === 'needs_city' ? LIFECYCLE.TEAM_BUILDING : null)
        || LIFECYCLE.APARTMENT_RANKING;
    return {
        ...discovery,
        lifecycle_state: lifecycleState,
        suggestion_batch_index: Number(discovery.suggestion_batch_index || 0),
        current_apartment_index: Number(discovery.current_apartment_index || 0),
        exhausted_suggestions: Boolean(discovery.exhausted_suggestions),
        preferences: discovery.preferences || discovery.rankings || {},
        eligible_apartments: discovery.eligible_apartments || discovery.ranking_scores || [],
        rejected_by_veto: discovery.rejected_by_veto || [],
        happiness_scores: discovery.happiness_scores || discovery.ranking_scores || [],
        current_apartment: discovery.current_apartment || discovery.winning_apartment || null,
        selected_apartment: discovery.selected_apartment || null,
        rejected_apartments: discovery.rejected_apartments || [],
        no_eligible_apartment: Boolean(discovery.no_eligible_apartment),
        no_more_suggestions: Boolean(discovery.no_more_suggestions),
    };
}

async function ensureDiscovery(base44, user) {
    const sr = base44.asServiceRole.entities;
    const me = await getProfile(sr, user.id);
    if (!me) return Response.json({ error: 'Profile not found' }, { status: 404 });
    if (apartmentFlowKilledForUser(user, me)) {
        return Response.json({
            success: true,
            discovery: null,
            status: 'apartment_flow_disabled',
            apartment_flow_enabled: false,
        });
    }

    const rawRoster = await rosterUserIds(sr, user.id, me);
    const profiles = await realTeamProfiles(sr, rawRoster);
    const memberIds = profiles.map((profile) => String(profile.user_id));
    const targetCount = Number(me.team_target || 3);

    if (memberIds.length < 2 || memberIds.length < targetCount) {
        return Response.json({
            success: true,
            discovery: null,
            status: 'not_established',
            member_count: memberIds.length,
            target_count: targetCount,
        });
    }

    const key = teamKey(memberIds);
    const existing = (await sr.TeamApartmentDiscovery.filter({ team_key: key }))[0];
    if (existing) {
        const denied = assertTeamMember(existing, user.id);
        if (denied) return denied;
        const normalized = normalizeDiscoveryState(existing);
        return Response.json(serialize(normalized, { status: normalized.status || statusForLifecycle(normalized.lifecycle_state) }));
    }

    const { commonCities, suggestedCities } = calculateCityState(profiles);
    const selectedCity = commonCities[0] || '';
    const bedrooms = memberIds.length;
    const discovery = await sr.TeamApartmentDiscovery.create({
        team_key: key,
        member_user_ids: memberIds,
        member_count: memberIds.length,
        entered_discovery: true,
        common_cities: commonCities,
        suggested_cities: suggestedCities,
        selected_city: selectedCity,
        bedrooms,
        suggested_apartments: [],
        lifecycle_state: selectedCity ? LIFECYCLE.APARTMENT_RANKING : LIFECYCLE.TEAM_BUILDING,
        suggestion_batch_index: 0,
        current_apartment_index: 0,
        exhausted_suggestions: false,
        preferences: {},
        eligible_apartments: [],
        rejected_by_veto: [],
        happiness_scores: [],
        current_apartment: null,
        selected_apartment: null,
        rejected_apartments: [],
        no_eligible_apartment: false,
        no_more_suggestions: false,
        rankings: {},
        rankings_finalized: false,
        ranking_scores: [],
        status: selectedCity ? 'collecting_options' : 'needs_city',
    });

    return Response.json(serialize(discovery, { status: discovery.status }));
}

function validatePreferencePayload(discovery, preferencePayload) {
    if (discovery.lifecycle_state !== LIFECYCLE.APARTMENT_RANKING) {
        return 'Apartment preferences can only be changed during ranking';
    }
    const apartments = discovery.suggested_apartments || [];
    if (apartments.length !== 3) {
        return 'Exactly three apartment suggestions are required before rating';
    }
    if (!preferencePayload || typeof preferencePayload !== 'object' || Array.isArray(preferencePayload)) {
        return 'Preference payload is required';
    }
    const apartmentIds = apartments.map((apt) => apt.id);
    const submittedIds = Object.keys(preferencePayload);
    if (submittedIds.length !== apartmentIds.length) {
        return 'All apartments must be rated';
    }
    if (!apartmentIds.every((id) => submittedIds.includes(id))) {
        return 'Preference payload includes an unknown apartment';
    }
    const values = submittedIds.map((id) => preferencePayload[id]);
    if (!values.every((value) => PREFERENCE_VALUES.includes(value))) {
        return 'Preference payload includes an invalid rating';
    }
    return null;
}

function calculatePreferenceOutcome(discovery, preferences) {
    const apartments = discovery.suggested_apartments || [];
    const happinessScores = apartments.map((apartment, index) => ({
        apartment_id: apartment.id,
        points: 0,
        amazing_votes: 0,
        ok_votes: 0,
        veto_user_ids: [],
        price: Number(apartment.price || 0),
        index,
    }));
    const byId = new Map(happinessScores.map((score) => [score.apartment_id, score]));

    for (const entry of Object.values(preferences || {})) {
        const userId = String(entry?.user_id || '');
        const memberPreferences = entry?.preferences || entry?.rankings || {};
        for (const [apartmentId, preference] of Object.entries(memberPreferences)) {
            const score = byId.get(apartmentId);
            if (!score) continue;
            if (preference === 'no_way') {
                score.veto_user_ids.push(userId);
                continue;
            }
            score.points += PREFERENCE_POINTS[preference] || 0;
            if (preference === 'amazing') score.amazing_votes += 1;
            if (preference === 'ok') score.ok_votes += 1;
        }
    }

    const rejectedByVeto = happinessScores
        .filter((score) => score.veto_user_ids.length > 0)
        .map((score) => ({
            apartment_id: score.apartment_id,
            veto_user_ids: score.veto_user_ids,
            veto_count: score.veto_user_ids.length,
            price: score.price,
            index: score.index,
        }));

    const eligibleApartments = happinessScores
        .filter((score) => score.veto_user_ids.length === 0)
        .sort((a, b) =>
        b.points - a.points
        || b.amazing_votes - a.amazing_votes
        || a.price - b.price
        || a.index - b.index
    );
    const currentApartment = apartments.find((apt) => apt.id === eligibleApartments[0]?.apartment_id) || null;
    return {
        eligibleApartments,
        rejectedByVeto,
        happinessScores,
        currentApartment,
        noEligibleApartment: eligibleApartments.length === 0,
    };
}

async function submitPreferences(base44, user, body) {
    const sr = base44.asServiceRole.entities;
    const discovery = await getDiscoveryById(sr, body.discovery_id);
    if (!discovery) return Response.json({ error: 'Discovery not found' }, { status: 404 });
    const denied = assertTeamMember(discovery, user.id);
    if (denied) return denied;
    const normalized = normalizeDiscoveryState(discovery);

    const submittedPreferences = body.preferences || body.rankings || {};
    const validationError = validatePreferencePayload(normalized, submittedPreferences);
    if (validationError) return Response.json({ error: validationError }, { status: 400 });

    const preferences = {
        ...(normalized.preferences || {}),
        [String(user.id)]: {
            user_id: String(user.id),
            preferences: submittedPreferences,
            submitted_at: new Date().toISOString(),
        },
    };

    const allSubmitted = (normalized.member_user_ids || []).every((memberId) => preferences[String(memberId)]);
    const result = allSubmitted ? calculatePreferenceOutcome(normalized, preferences) : null;
    const update = {
        preferences,
        rankings: preferences,
        no_eligible_apartment: false,
        no_more_suggestions: false,
        ...(result
            ? result.noEligibleApartment
                ? {
                    lifecycle_state: LIFECYCLE.APARTMENT_RANKING,
                    status: 'no_eligible_apartment',
                    rankings_finalized: false,
                    eligible_apartments: [],
                    rejected_by_veto: result.rejectedByVeto,
                    happiness_scores: result.happinessScores,
                    ranking_scores: result.happinessScores,
                    current_apartment: null,
                    winning_apartment_id: '',
                    winning_apartment: null,
                    no_eligible_apartment: true,
                }
                : {
                rankings_finalized: true,
                    lifecycle_state: LIFECYCLE.APARTMENT_VIEWING,
                    status: 'apartment_viewing',
                    current_apartment_index: 0,
                    eligible_apartments: result.eligibleApartments,
                    rejected_by_veto: result.rejectedByVeto,
                    happiness_scores: result.happinessScores,
                    ranking_scores: result.happinessScores,
                    current_apartment: result.currentApartment,
                    winning_apartment_id: result.currentApartment?.id || '',
                    winning_apartment: result.currentApartment || null,
            }
            : {}),
    };

    await sr.TeamApartmentDiscovery.update(discovery.id, update);
    const updated = await getDiscoveryById(sr, discovery.id);
    return Response.json(serialize(normalizeDiscoveryState(updated), { status: updated?.status || 'apartment_ranking' }));
}

async function changePreferences(base44, user, body) {
    const sr = base44.asServiceRole.entities;
    const discovery = await getDiscoveryById(sr, body.discovery_id);
    if (!discovery) return Response.json({ error: 'Discovery not found' }, { status: 404 });
    const denied = assertTeamMember(discovery, user.id);
    if (denied) return denied;
    const normalized = normalizeDiscoveryState(discovery);
    if (normalized.lifecycle_state !== LIFECYCLE.APARTMENT_RANKING) {
        return Response.json({ error: 'Preferences can only be changed during ranking' }, { status: 409 });
    }

    const preferences = { ...(normalized.preferences || {}) };
    delete preferences[String(user.id)];
    await sr.TeamApartmentDiscovery.update(discovery.id, {
        preferences,
        rankings: preferences,
        status: 'apartment_ranking',
        no_eligible_apartment: false,
        no_more_suggestions: false,
        eligible_apartments: [],
        rejected_by_veto: [],
        happiness_scores: [],
        current_apartment: null,
        winning_apartment_id: '',
        winning_apartment: null,
    });
    const updated = await getDiscoveryById(sr, discovery.id);
    return Response.json(serialize(normalizeDiscoveryState(updated), { status: updated?.status || 'apartment_ranking' }));
}

async function requestMoreSuggestions(base44, user, body) {
    const sr = base44.asServiceRole.entities;
    const discovery = await getDiscoveryById(sr, body.discovery_id);
    if (!discovery) return Response.json({ error: 'Discovery not found' }, { status: 404 });
    const denied = assertTeamMember(discovery, user.id);
    if (denied) return denied;

    await sr.TeamApartmentDiscovery.update(discovery.id, {
        lifecycle_state: LIFECYCLE.APARTMENT_RANKING,
        status: 'no_more_suggestions',
        no_more_suggestions: true,
        exhausted_suggestions: true,
        no_eligible_apartment: false,
    });
    const updated = await getDiscoveryById(sr, discovery.id);
    return Response.json(serialize(normalizeDiscoveryState(updated), {
        status: 'no_more_suggestions',
        no_more_suggestions: true,
    }));
}

async function scheduleVisit(base44, user, body) {
    const sr = base44.asServiceRole.entities;
    const discovery = await getDiscoveryById(sr, body.discovery_id);
    if (!discovery) return Response.json({ error: 'Discovery not found' }, { status: 404 });
    const denied = assertTeamMember(discovery, user.id);
    if (denied) return denied;
    const normalized = normalizeDiscoveryState(discovery);
    if (normalized.lifecycle_state !== LIFECYCLE.APARTMENT_VIEWING) {
        return Response.json({ error: 'An apartment must be selected for viewing before scheduling a visit' }, { status: 409 });
    }

    const visit = new Date(body.visit_time || '');
    if (!Number.isFinite(visit.getTime())) {
        return Response.json({ error: 'A valid visit time is required' }, { status: 400 });
    }

    await sr.TeamApartmentDiscovery.update(discovery.id, {
        visit_time: visit.toISOString(),
        visit_scheduled_by_user_id: String(user.id),
        visit_scheduled_at: new Date().toISOString(),
    });
    const updated = await getDiscoveryById(sr, discovery.id);
    return Response.json(serialize(normalizeDiscoveryState(updated), { status: updated?.status || 'apartment_viewing' }));
}

async function rejectCurrentApartment(base44, user, body) {
    const sr = base44.asServiceRole.entities;
    const discovery = await getDiscoveryById(sr, body.discovery_id);
    if (!discovery) return Response.json({ error: 'Discovery not found' }, { status: 404 });
    const denied = assertTeamMember(discovery, user.id);
    if (denied) return denied;
    const normalized = normalizeDiscoveryState(discovery);
    if (normalized.lifecycle_state !== LIFECYCLE.APARTMENT_VIEWING || !normalized.current_apartment) {
        return Response.json({ error: 'No current apartment is available to reject' }, { status: 409 });
    }

    const currentIndex = Number(normalized.current_apartment_index || 0);
    const nextIndex = currentIndex + 1;
    const nextScore = normalized.eligible_apartments?.[nextIndex] || null;
    const nextApartment = (normalized.suggested_apartments || []).find((apt) => apt.id === nextScore?.apartment_id) || null;
    const rejectedApartments = [
        ...(normalized.rejected_apartments || []),
        {
            apartment_id: normalized.current_apartment.id,
            reason: String(body.reason || 'other'),
            rejected_by_user_id: String(user.id),
            rejected_at: new Date().toISOString(),
        },
    ];

    const update = nextApartment
        ? {
            current_apartment_index: nextIndex,
            current_apartment: nextApartment,
            winning_apartment_id: nextApartment.id,
            winning_apartment: nextApartment,
            rejected_apartments: rejectedApartments,
            visit_time: '',
            visit_scheduled_by_user_id: '',
            visit_scheduled_at: '',
        }
        : {
            lifecycle_state: LIFECYCLE.APARTMENT_RANKING,
            status: 'apartment_ranking',
            preferences: {},
            rankings: {},
            rankings_finalized: false,
            current_apartment_index: 0,
            current_apartment: null,
            winning_apartment_id: '',
            winning_apartment: null,
            rejected_apartments: rejectedApartments,
            no_eligible_apartment: false,
        };

    await sr.TeamApartmentDiscovery.update(discovery.id, update);
    const updated = await getDiscoveryById(sr, discovery.id);
    return Response.json(serialize(normalizeDiscoveryState(updated), { status: updated?.status || statusForLifecycle(updated?.lifecycle_state) }));
}

async function chooseCurrentApartment(base44, user, body) {
    const sr = base44.asServiceRole.entities;
    const discovery = await getDiscoveryById(sr, body.discovery_id);
    if (!discovery) return Response.json({ error: 'Discovery not found' }, { status: 404 });
    const denied = assertTeamMember(discovery, user.id);
    if (denied) return denied;
    const normalized = normalizeDiscoveryState(discovery);
    const apartment = normalized.current_apartment || normalized.winning_apartment;
    if (normalized.lifecycle_state !== LIFECYCLE.APARTMENT_VIEWING || !apartment) {
        return Response.json({ error: 'No current apartment is available to choose' }, { status: 409 });
    }

    await sr.TeamApartmentDiscovery.update(discovery.id, {
        lifecycle_state: LIFECYCLE.APARTMENT_FOUND,
        status: 'apartment_found',
        selected_apartment_id: apartment.id,
        selected_apartment: apartment,
        winning_apartment_id: apartment.id,
        winning_apartment: apartment,
        current_apartment: apartment,
    });
    const updated = await getDiscoveryById(sr, discovery.id);
    return Response.json(serialize(normalizeDiscoveryState(updated), { status: 'apartment_found' }));
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        let user = null;
        try { user = await base44.auth.me(); } catch (_) { user = null; }
        if (!user?.id) {
            return Response.json({ error: 'Authentication required' }, { status: 401 });
        }

        const body = await req.json();
        const action = body?.action || 'ensure';

        if (action === 'ensure') return await ensureDiscovery(base44, user);
        if (action === 'submit_preferences' || action === 'submit_ranking') return await submitPreferences(base44, user, body);
        if (action === 'change_preferences') return await changePreferences(base44, user, body);
        if (action === 'request_more_suggestions') return await requestMoreSuggestions(base44, user, body);
        if (action === 'schedule_visit') return await scheduleVisit(base44, user, body);
        if (action === 'reject_current_apartment') return await rejectCurrentApartment(base44, user, body);
        if (action === 'choose_current_apartment') return await chooseCurrentApartment(base44, user, body);

        return Response.json({ error: 'Unknown action' }, { status: 400 });
    } catch (error) {
        console.error('teamApartmentDiscovery error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});
