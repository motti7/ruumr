import React, { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { User } from "@/entities/User";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Area, AreaChart
} from "recharts";
import {
  Users, Heart, Zap, TrendingUp, ArrowLeft, ArrowRight,
  RefreshCw, Circle, ChevronUp, ChevronDown, Search,
  Filter, Download
} from "lucide-react";
import KpiCard from "@/components/admin/KpiCard";
import LiveFeed from "@/components/admin/LiveFeed";
import UsersTable from "@/components/admin/UsersTable";

const POLL_INTERVAL = 15000; // 15s real-time polling

export default function AdminAnalyticsPage() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // KPIs
  const [kpis, setKpis] = useState({ totalUsers: 0, activeUsers: 0, totalMatches: 0, totalSwipes: 0 });

  // Chart data
  const [userGrowth, setUserGrowth] = useState([]);
  const [swipeActivity, setSwipeActivity] = useState([]);

  // Live feed
  const [liveFeed, setLiveFeed] = useState([]);
  const prevMatchesRef = useRef([]);
  const prevSwipesRef = useRef([]);

  const fetchAll = useCallback(async () => {
    try {
      const [allUsers, allProfiles, allMatches, allSwipes] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.Profile.list("-created_date", 1000),
        base44.entities.Match.list("-created_date", 1000),
        base44.entities.Swipe.list("-created_date", 2000),
      ]);

      // --- KPIs ---
      const now = Date.now();
      const h24 = 24 * 60 * 60 * 1000;
      const activeUsers = allProfiles.filter(p => {
        const updated = p.updated_date ? new Date(p.updated_date).getTime() : 0;
        return (now - updated) < h24;
      }).length;

      setKpis({
        totalUsers: allUsers.length,
        activeUsers,
        totalMatches: allMatches.length,
        totalSwipes: allSwipes.length,
      });

      // --- User Growth (last 14 days) ---
      const growth = buildDailyBuckets(allUsers, 14, 'created_date');
      setUserGrowth(growth);

      // --- Swipe Activity (last 7 days) ---
      const activity = buildSwipeBuckets(allSwipes, 7);
      setSwipeActivity(activity);

      // --- Live Feed diff ---
      const newMatches = allMatches.filter(m => !prevMatchesRef.current.find(pm => pm.id === m.id));
      const newSwipes = allSwipes.filter(s =>
        s.action === 'like' && !prevSwipesRef.current.find(ps => ps.id === s.id)
      ).slice(0, 10);

      const feedItems = [
        ...newMatches.map(m => ({
          id: `match-${m.id}`,
          type: 'match',
          text: `💞 ${m.user1_name || 'משתמש'} התאים עם ${m.user2_name || 'משתמש'}`,
          time: m.created_date,
        })),
        ...newSwipes.map(s => ({
          id: `swipe-${s.id}`,
          type: 'like',
          text: `❤️ ${s.swiper_name || 'משתמש'} עשה לייק ל-${s.swiped_name || 'משתמש'}`,
          time: s.created_date,
        })),
      ];

      if (feedItems.length > 0) {
        setLiveFeed(prev => [...feedItems, ...prev].slice(0, 50));
      }

      prevMatchesRef.current = allMatches;
      prevSwipesRef.current = allSwipes;

    } catch (e) {
      console.error("Analytics fetch error:", e);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const me = await User.me();
        if (me.role !== 'admin') {
          navigate(createPageUrl('Discover'), { replace: true });
          return;
        }
        setIsAdmin(true);
        setLoading(false);
        await fetchAll();
      } catch (e) {
        navigate(createPageUrl('Discover'), { replace: true });
      }
    };
    init();
  }, [navigate, fetchAll]);

  // Real-time polling
  useEffect(() => {
    if (!isAdmin) return;
    const interval = setInterval(fetchAll, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [isAdmin, fetchAll]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-700 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans" dir="rtl">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/90 backdrop-blur-sm sticky top-0 z-50 px-6 py-4">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white leading-none">ruumr <span className="text-orange-400">God Mode</span></h1>
              <p className="text-xs text-gray-500 mt-0.5">Analytics Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-400/10 px-3 py-1.5 rounded-full border border-green-400/20">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Live — מתעדכן כל 15 שניות
            </div>
            <button
              onClick={fetchAll}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-6 py-8 space-y-8">
        {/* KPI Bar */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="סה״כ משתמשים" value={kpis.totalUsers} icon={Users} color="blue" trend="+2 היום" />
          <KpiCard label="פעילים (24 שעות)" value={kpis.activeUsers} icon={Circle} color="green" trend="אחרונים" />
          <KpiCard label="התאמות" value={kpis.totalMatches} icon={Heart} color="pink" trend="סה״כ" />
          <KpiCard label="סווייפים" value={kpis.totalSwipes} icon={TrendingUp} color="orange" trend="סה״כ" />
        </section>

        {/* Charts Row */}
        <section className="grid lg:grid-cols-2 gap-6">
          {/* User Growth */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-gray-400 mb-1">גדילת משתמשים</h2>
            <p className="text-xs text-gray-600 mb-4">14 ימים אחרונים</p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={userGrowth}>
                <defs>
                  <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, color: '#fff' }} />
                <Area type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} fill="url(#userGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Swipe Activity */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-gray-400 mb-1">פעילות סווייפים</h2>
            <p className="text-xs text-gray-600 mb-4">7 ימים אחרונים</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={swipeActivity} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, color: '#fff' }} />
                <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
                <Bar dataKey="likes" name="לייקים" fill="#f97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey="dislikes" name="דיסלייקים" fill="#374151" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Bottom Row: Live Feed + Users Table */}
        <section className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <LiveFeed events={liveFeed} />
          </div>
          <div className="lg:col-span-2">
            <UsersTable />
          </div>
        </section>
      </main>
    </div>
  );
}

// --- Helpers ---
function buildDailyBuckets(items, days, dateField) {
  const buckets = {};
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = `${d.getDate()}/${d.getMonth() + 1}`;
    buckets[key] = 0;
  }
  items.forEach(item => {
    const d = new Date(item[dateField]);
    const key = `${d.getDate()}/${d.getMonth() + 1}`;
    if (key in buckets) buckets[key]++;
  });
  let cumulative = 0;
  return Object.entries(buckets).map(([date, count]) => {
    cumulative += count;
    return { date, users: cumulative, new: count };
  });
}

function buildSwipeBuckets(swipes, days) {
  const buckets = {};
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = `${d.getDate()}/${d.getMonth() + 1}`;
    buckets[key] = { date: key, likes: 0, dislikes: 0 };
  }
  swipes.forEach(s => {
    const d = new Date(s.created_date);
    const key = `${d.getDate()}/${d.getMonth() + 1}`;
    if (buckets[key]) {
      if (s.action === 'like') buckets[key].likes++;
      else buckets[key].dislikes++;
    }
  });
  return Object.values(buckets);
}