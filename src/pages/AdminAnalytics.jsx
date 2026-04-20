import React, { useState, useEffect, useCallback, useRef } from "react";
import { User } from "@/entities/User";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { adminAnalytics } from "@/functions/adminAnalytics";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart
} from "recharts";
import { 
  Users, Heart, Zap, TrendingUp, Activity, ShieldCheck,
  RefreshCw, ArrowUpRight, UserCheck, MapPin, Wallet, ChevronUp, ChevronDown
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const COLORS = ['#FF5722', '#FF8A65', '#FFCCBC', '#E64A19', '#BF360C', '#FF7043', '#FF3D00', '#DD2C00'];
const REFRESH_INTERVAL = 30000; // 30 seconds

function KpiCard({ title, value, sub, icon: Icon, color, trend }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-3 hover:border-orange-500/40 transition-all">
      <div className="flex justify-between items-start">
        <div className={`p-2 rounded-xl bg-opacity-20`} style={{ background: `${color}20` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {trend !== undefined && (
          <span className={`text-xs flex items-center gap-1 font-bold ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend >= 0 ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{title}</p>
        <p className="text-white text-3xl font-black mt-1">{value?.toLocaleString() ?? '—'}</p>
        {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function LiveFeedItem({ event, index }) {
  const typeConfig = {
    match: { color: '#FF5722', label: '💕 התאמה', bg: 'rgba(255,87,34,0.1)' },
    like: { color: '#FF8A65', label: '❤️ לייק', bg: 'rgba(255,138,101,0.1)' },
    register: { color: '#66BB6A', label: '🆕 הצטרף', bg: 'rgba(102,187,106,0.1)' },
  };
  const cfg = typeConfig[event.type] || typeConfig.register;
  const timeAgo = (() => {
    const diff = Date.now() - new Date(event.time).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'עכשיו';
    if (mins < 60) return `לפני ${mins}ד'`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `לפני ${hrs}ש'`;
    return `לפני ${Math.floor(hrs / 24)}י'`;
  })();

  return (
    <div
      className="flex items-center gap-3 py-2.5 px-3 rounded-xl border border-gray-800/60 text-sm"
      style={{ background: cfg.bg, animationDelay: `${index * 50}ms` }}
    >
      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: cfg.color, background: `${cfg.color}20` }}>
        {cfg.label}
      </span>
      <span className="text-gray-300 flex-1 truncate" dir="rtl">{event.text}</span>
      <span className="text-gray-600 text-xs shrink-0">{timeAgo}</span>
    </div>
  );
}

const VIBE_LABELS = { 1: 'שקט', 2: 'רגוע', 3: 'מאוזן', 4: 'חברותי', 5: 'תוסס' };
const STATUS_LABELS = { seeking_apartment: 'מחפש דירה', has_apartment: 'יש דירה' };
const GENDER_LABELS = { male: 'זכר', female: 'נקבה', other: 'אחר' };

export default function AdminAnalyticsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("created_date");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 25;
  const intervalRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await adminAnalytics({});
      setData(res.data);
      setLastUpdated(new Date());
    } catch (e) {
      console.error("Analytics fetch error:", e);
    } finally {
      setLoading(false);
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
        await fetchData();
        intervalRef.current = setInterval(fetchData, REFRESH_INTERVAL);
      } catch {
        navigate(createPageUrl('Discover'), { replace: true });
      }
    };
    init();
    return () => clearInterval(intervalRef.current);
  }, [navigate, fetchData]);

  // Filtered + sorted user table
  const filteredUsers = (data?.userData || [])
    .filter(u => {
      if (!search) return true;
      const q = search.toLowerCase();
      return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.location?.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const va = a[sortKey] ?? '';
      const vb = b[sortKey] ?? '';
      if (sortDir === 'asc') return va > vb ? 1 : -1;
      return va < vb ? 1 : -1;
    });

  const paginatedUsers = filteredUsers.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
    setPage(0);
  };

  const SortIcon = ({ k }) => sortKey === k 
    ? (sortDir === 'asc' ? <ChevronUp className="w-3 h-3 inline ml-1 text-orange-400" /> : <ChevronDown className="w-3 h-3 inline ml-1 text-orange-400" />)
    : null;

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-gray-700 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 text-sm">טוען נתונים...</p>
      </div>
    </div>
  );

  const { kpis, userGrowth, swipeActivity, genderBreakdown, locationBreakdown, budgetDistribution, liveFeed } = data || {};

  const genderData = genderBreakdown ? [
    { name: 'זכר', value: genderBreakdown.male },
    { name: 'נקבה', value: genderBreakdown.female },
    { name: 'אחר', value: genderBreakdown.other },
  ] : [];

  return (
    <div className="min-h-screen bg-gray-950 text-white" dir="rtl">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-500" />
              God Mode — Analytics
            </h1>
            <p className="text-gray-500 text-xs mt-0.5">
              {lastUpdated ? `עודכן: ${lastUpdated.toLocaleTimeString('he-IL')}` : 'טוען...'} · מתרענן כל 30 שניות
            </p>
          </div>
          <button
            onClick={() => { setLoading(true); fetchData(); }}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-orange-400 transition-colors px-3 py-2 rounded-lg hover:bg-gray-800"
          >
            <RefreshCw className="w-4 h-4" />
            רענן
          </button>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-10">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="col-span-2 md:col-span-2">
            <KpiCard title="סה״כ משתמשים" value={kpis?.totalUsers} icon={Users} color="#FF5722" sub={`${kpis?.totalProfiles} עם פרופיל`} />
          </div>
          <div className="col-span-2 md:col-span-2">
            <KpiCard title="פעילים 24 שעות" value={kpis?.activeUsers} icon={Activity} color="#FF8A65" sub="עדכנו פרופיל" />
          </div>
          <div className="col-span-2 md:col-span-1">
            <KpiCard title="התאמות" value={kpis?.totalMatches} icon={Heart} color="#E91E63" />
          </div>
          <div className="col-span-2 md:col-span-1">
            <KpiCard title="סוויפים" value={kpis?.totalSwipes} icon={TrendingUp} color="#9C27B0" sub={`${kpis?.likeRate}% לייקים`} />
          </div>
          <div className="col-span-2 md:col-span-1">
            <KpiCard title="מאומתים" value={kpis?.verifiedCount} icon={ShieldCheck} color="#4CAF50" />
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Growth - Area Chart */}
          <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-white font-bold text-base mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-400" />
              גידול משתמשים (30 יום אחרונים)
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={userGrowth} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF5722" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FF5722" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={v => v.slice(5)} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }} />
                <Area type="monotone" dataKey="totalUsers" stroke="#FF5722" strokeWidth={2} fill="url(#growthGrad)" name="סה״כ משתמשים" />
                <Bar dataKey="newUsers" fill="#FF8A65" name="חדשים" barSize={4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Gender Pie */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-white font-bold text-base mb-4 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-orange-400" />
              פילוח מגדרי
            </h2>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={genderData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                  {genderData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-3 justify-center mt-2">
              {genderData.map((g, i) => (
                <div key={i} className="flex items-center gap-1 text-xs text-gray-400">
                  <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i] }} />
                  {g.name}: {g.value}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Swipe Activity */}
          <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-white font-bold text-base mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-orange-400" />
              פעילות סוויפים (14 יום)
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={swipeActivity} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }} />
                <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
                <Bar dataKey="likes" fill="#FF5722" name="לייקים" radius={[4, 4, 0, 0]} />
                <Bar dataKey="dislikes" fill="#374151" name="דיסלייקים" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Budget Distribution */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-white font-bold text-base mb-4 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-orange-400" />
              פילוח תקציב (₪)
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={budgetDistribution} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 10 }} />
                <YAxis type="category" dataKey="range" tick={{ fill: '#9ca3af', fontSize: 10 }} width={70} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="count" fill="#FF7043" radius={[0, 4, 4, 0]} name="משתמשים" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Location + Live Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Location Breakdown */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-white font-bold text-base mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-orange-400" />
              פיזור גיאוגרפי
            </h2>
            <div className="space-y-2">
              {locationBreakdown?.map((loc, i) => {
                const max = locationBreakdown[0]?.count || 1;
                const pct = Math.round((loc.count / max) * 100);
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-gray-400 text-sm w-28 truncate shrink-0">{loc.name}</span>
                    <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-orange-600 to-orange-400 transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-gray-300 text-sm font-bold w-6 text-left">{loc.count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Feed */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col">
            <h2 className="text-white font-bold text-base mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-400" />
              פיד בזמן אמת
              <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse mr-auto" />
            </h2>
            <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[280px] scrollbar-thin">
              {liveFeed?.map((event, i) => (
                <LiveFeedItem key={i} event={event} index={i} />
              ))}
              {!liveFeed?.length && <p className="text-gray-600 text-sm text-center py-8">אין אירועים עדיין</p>}
            </div>
          </div>
        </div>

        {/* User Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-gray-800 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <h2 className="text-white font-bold text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-400" />
              כל המשתמשים
              <span className="text-gray-500 text-sm font-normal">({filteredUsers.length})</span>
            </h2>
            <input
              type="text"
              placeholder="חיפוש לפי שם, מייל, עיר..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 w-full sm:w-64 focus:outline-none focus:border-orange-500 text-right"
              dir="rtl"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  {[
                    { key: 'name', label: 'שם' },
                    { key: 'email', label: 'מייל' },
                    { key: 'age', label: 'גיל' },
                    { key: 'gender', label: 'מגדר' },
                    { key: 'location', label: 'עיר' },
                    { key: 'budget_max', label: 'תקציב' },
                    { key: 'vibe_level', label: 'וייב' },
                    { key: 'current_status', label: 'סטטוס' },
                    { key: 'is_verified', label: 'אימות' },
                    { key: 'created_date', label: 'הצטרף' },
                  ].map(col => (
                    <th
                      key={col.key}
                      onClick={() => toggleSort(col.key)}
                      className="text-right text-gray-400 font-medium px-4 py-3 cursor-pointer hover:text-orange-400 transition-colors whitespace-nowrap select-none"
                    >
                      {col.label}<SortIcon k={col.key} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((u, i) => (
                  <tr key={u.id} className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-900/50'}`}>
                    <td className="px-4 py-3 font-medium text-white whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {u.photo ? (
                          <img src={u.photo} className="w-7 h-7 rounded-full object-cover shrink-0" alt="" onError={e => e.target.style.display='none'} />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-gray-700 shrink-0" />
                        )}
                        {u.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{u.email}</td>
                    <td className="px-4 py-3 text-gray-300">{u.age}</td>
                    <td className="px-4 py-3 text-gray-300">{GENDER_LABELS[u.gender] || u.gender}</td>
                    <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{u.location}</td>
                    <td className="px-4 py-3 text-gray-300">
                      {u.budget_max ? `₪${u.budget_max.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-300">{VIBE_LABELS[u.vibe_level] || u.vibe_level}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${u.current_status === 'has_apartment' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                        {STATUS_LABELS[u.current_status] || u.current_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${u.is_verified ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-500'}`}>
                        {u.is_verified ? '✓ מאומת' : 'לא מאומת'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(u.created_date).toLocaleDateString('he-IL')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-5 py-4 border-t border-gray-800 flex items-center justify-between">
              <span className="text-gray-500 text-sm">
                עמוד {page + 1} מתוך {totalPages} · {filteredUsers.length} רשומות
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 text-sm rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  הקודם
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = Math.max(0, Math.min(page - 2, totalPages - 5)) + i;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 text-sm rounded-lg transition-colors ${p === page ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    >
                      {p + 1}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 text-sm rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  הבא
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}