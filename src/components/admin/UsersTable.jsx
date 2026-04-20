import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ShieldAlert, MessageSquare } from "lucide-react";

const PAGE_SIZE = 20;

export default function UsersTable() {
  const [users, setUsers] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState("created_date");
  const [sortDir, setSortDir] = useState("desc");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [allUsers, allProfiles] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.Profile.list("-created_date", 2000),
      ]);
      const profileMap = {};
      allProfiles.forEach(p => { profileMap[p.user_id] = p; });
      setUsers(allUsers);
      setProfiles(profileMap);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
    setPage(0);
  };

  const handleBan = async (user) => {
    if (!confirm(`חסום את ${user.email}?`)) return;
    await base44.entities.BannedUser.create({ email: user.email, reason: "Admin ban from analytics" });
    alert("נחסם");
  };

  const handleMessage = async (user) => {
    const msg = prompt("הודעה:");
    if (!msg) return;
    await base44.integrations.Core.SendEmail({ to: user.email, subject: "הודעה מצוות Ruumr", body: msg.replace(/\n/g, '<br>') });
  };

  const filtered = users.filter(u => {
    if (!search) return true;
    const s = search.toLowerCase();
    const p = profiles[u.id];
    return (
      u.email?.toLowerCase().includes(s) ||
      u.full_name?.toLowerCase().includes(s) ||
      p?.name?.toLowerCase().includes(s) ||
      p?.location?.toLowerCase().includes(s)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    let av, bv;
    if (sortKey === "budget") {
      av = profiles[a.id]?.budget_max || 0;
      bv = profiles[b.id]?.budget_max || 0;
    } else if (sortKey === "age") {
      av = profiles[a.id]?.age || 0;
      bv = profiles[b.id]?.age || 0;
    } else {
      av = a[sortKey] || "";
      bv = b[sortKey] || "";
    }
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const SortIcon = ({ k }) => sortKey === k
    ? (sortDir === "asc" ? <ChevronUp className="w-3 h-3 inline ml-1" /> : <ChevronDown className="w-3 h-3 inline ml-1" />)
    : <span className="w-3 h-3 inline-block ml-1 opacity-0 group-hover:opacity-30">↕</span>;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl flex flex-col h-[500px]">
      {/* Header */}
      <div className="p-5 border-b border-gray-800 flex items-center justify-between gap-3 flex-shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-gray-400">ניהול משתמשים</h2>
          <p className="text-xs text-gray-600">{filtered.length} / {users.length} משתמשים</p>
        </div>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="חיפוש..."
            className="bg-gray-800 border border-gray-700 text-white text-xs rounded-lg pl-3 pr-9 py-2 w-48 placeholder-gray-600 focus:outline-none focus:border-orange-500"
            dir="rtl"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-gray-900 border-b border-gray-800 z-10">
            <tr>
              {[
                { key: "full_name", label: "שם" },
                { key: "email", label: "אימייל" },
                { key: "age", label: "גיל" },
                { key: "budget", label: "תקציב מקס'" },
                { key: "location", label: "מיקום" },
                { key: "created_date", label: "הצטרף" },
                { key: null, label: "פעולות" },
              ].map(col => (
                <th
                  key={col.key || "actions"}
                  onClick={() => col.key && handleSort(col.key)}
                  className={`text-right text-gray-500 font-medium px-4 py-3 select-none group ${col.key ? "cursor-pointer hover:text-gray-300" : ""}`}
                >
                  {col.label}
                  {col.key && <SortIcon k={col.key} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-600">טוען...</td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-600">אין תוצאות</td></tr>
            ) : paginated.map(user => {
              const p = profiles[user.id];
              return (
                <tr key={user.id} className="border-b border-gray-800/50 hover:bg-gray-800/40 transition-colors">
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      {p?.photos?.[0] && (
                        <img src={p.photos[0]} className="w-7 h-7 rounded-full object-cover" alt="" />
                      )}
                      <span className="text-white font-medium">{user.full_name || p?.name || "—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-right">{user.email}</td>
                  <td className="px-4 py-3 text-gray-400 text-right">{p?.age || "—"}</td>
                  <td className="px-4 py-3 text-gray-400 text-right">
                    {p?.budget_max ? `₪${p.budget_max.toLocaleString()}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-right">
                    {p?.location || (p?.search_cities?.[0] ?? "—")}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-right">
                    {new Date(user.created_date).toLocaleDateString("he-IL")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => handleMessage(user)} className="p-1.5 rounded-lg hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 transition-colors">
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleBan(user)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors">
                        <ShieldAlert className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-800 flex items-center justify-between flex-shrink-0">
          <span className="text-xs text-gray-600">עמוד {page + 1} מתוך {totalPages}</span>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-30 text-gray-400"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(0, Math.min(page - 2 + i, totalPages - 5 + i));
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${page === p ? "bg-orange-500 text-white" : "bg-gray-800 hover:bg-gray-700 text-gray-400"}`}
                >
                  {p + 1}
                </button>
              );
            })}
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
              className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-30 text-gray-400"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}