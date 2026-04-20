import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const sr = base44.asServiceRole;

    // Fetch all data in parallel
    const [users, profiles, swipes, matches] = await Promise.all([
      sr.entities.User.list(),
      sr.entities.Profile.list(),
      sr.entities.Swipe.list(),
      sr.entities.Match.list(),
    ]);

    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;

    // Active users last 24h (based on profile updated_date as proxy)
    const activeUsers = profiles.filter(p => {
      const updated = new Date(p.updated_date).getTime();
      return now - updated < DAY;
    }).length;

    // User growth by day (last 30 days)
    const growthMap = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now - i * DAY);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      growthMap[key] = 0;
    }
    users.forEach(u => {
      const d = new Date(u.created_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (growthMap[key] !== undefined) growthMap[key]++;
    });

    // Cumulative growth
    let cumulative = users.filter(u => new Date(u.created_date) < new Date(now - 29 * DAY)).length;
    const userGrowth = Object.entries(growthMap).map(([date, count]) => {
      cumulative += count;
      return { date, newUsers: count, totalUsers: cumulative };
    });

    // Swipe activity by day (last 14 days)
    const swipeMap = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now - i * DAY);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      swipeMap[key] = { date: key, likes: 0, dislikes: 0 };
    }
    swipes.forEach(s => {
      const d = new Date(s.created_date);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      if (swipeMap[key]) {
        if (s.action === 'like') swipeMap[key].likes++;
        else swipeMap[key].dislikes++;
      }
    });
    const swipeActivity = Object.values(swipeMap);

    // Gender breakdown
    const genderBreakdown = { male: 0, female: 0, other: 0 };
    profiles.forEach(p => {
      const g = p.gender || 'other';
      genderBreakdown[g] = (genderBreakdown[g] || 0) + 1;
    });

    // Location breakdown (top 8)
    const locationMap = {};
    profiles.forEach(p => {
      const loc = p.location || p.search_area || 'לא ידוע';
      locationMap[loc] = (locationMap[loc] || 0) + 1;
    });
    const locationBreakdown = Object.entries(locationMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));

    // Status breakdown
    const statusBreakdown = { seeking_apartment: 0, has_apartment: 0 };
    profiles.forEach(p => {
      const s = p.current_status || 'seeking_apartment';
      statusBreakdown[s] = (statusBreakdown[s] || 0) + 1;
    });

    // Verified count
    const verifiedCount = profiles.filter(p => p.is_verified).length;

    // Budget distribution buckets
    const budgetBuckets = { '0-2000': 0, '2001-3500': 0, '3501-5000': 0, '5001+': 0 };
    profiles.forEach(p => {
      const b = p.budget_max || 0;
      if (b <= 2000) budgetBuckets['0-2000']++;
      else if (b <= 3500) budgetBuckets['2001-3500']++;
      else if (b <= 5000) budgetBuckets['3501-5000']++;
      else budgetBuckets['5001+']++;
    });
    const budgetDistribution = Object.entries(budgetBuckets).map(([range, count]) => ({ range, count }));

    // Recent activity feed (last 20 events)
    const recentMatches = matches
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
      .slice(0, 10)
      .map(m => ({
        type: 'match',
        text: `${m.user1_name || 'משתמש'} התאים עם ${m.user2_name || 'משתמש'}`,
        time: m.created_date,
      }));

    const recentSwipeLikes = swipes
      .filter(s => s.action === 'like')
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
      .slice(0, 10)
      .map(s => ({
        type: 'like',
        text: `${s.swiper_name || 'משתמש'} לייק ל${s.swiped_name || 'משתמש'}`,
        time: s.created_date,
      }));

    const recentRegistrations = users
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
      .slice(0, 10)
      .map(u => ({
        type: 'register',
        text: `משתמש חדש: ${u.full_name || u.email}`,
        time: u.created_date,
      }));

    const liveFeed = [...recentMatches, ...recentSwipeLikes, ...recentRegistrations]
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 25);

    // Full user table data
    const profileMap = {};
    profiles.forEach(p => { profileMap[p.user_id] = p; });

    const userData = users.map(u => {
      const p = profileMap[u.id] || {};
      return {
        id: u.id,
        name: p.name || u.full_name || '—',
        email: u.email,
        age: p.age || '—',
        gender: p.gender || '—',
        location: p.location || p.search_area || '—',
        budget_max: p.budget_max || 0,
        vibe_level: p.vibe_level || '—',
        current_status: p.current_status || '—',
        is_verified: p.is_verified || false,
        is_visible: p.is_visible !== false,
        photo: p.photos?.[0] || null,
        created_date: u.created_date,
        religion: p.religion || '—',
        looking_for_gender: p.looking_for_gender || '—',
      };
    });

    return Response.json({
      kpis: {
        totalUsers: users.length,
        activeUsers,
        totalMatches: matches.length,
        totalSwipes: swipes.length,
        likeRate: swipes.length > 0 ? Math.round((swipes.filter(s => s.action === 'like').length / swipes.length) * 100) : 0,
        verifiedCount,
        totalProfiles: profiles.length,
      },
      userGrowth,
      swipeActivity,
      genderBreakdown,
      locationBreakdown,
      statusBreakdown,
      budgetDistribution,
      liveFeed,
      userData,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});