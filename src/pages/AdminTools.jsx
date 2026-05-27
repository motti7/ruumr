import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@/entities/User";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { grantRuumrPlusEntitlement, revokeRuumrPlusEntitlement } from "@/api/ruumrPlus";
import { Loader2, Search, Sparkles, Check, X } from "lucide-react";

// Admin-only console for managing Ruumr Plus access. A single action keeps the
// two sources of truth in sync: the Base44 User flag (`is_ruumr_plus`, read by
// isPlusEntitled on the client) and the entitlement on the Ruumr Plus service
// (granted via the ruumrPlusBridge admin action). Both must agree, otherwise a
// user either sees the Plus UI with no server access or vice versa.
export default function AdminToolsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  // Per-user in-flight state, keyed by user id, holds "grant" | "revoke".
  const [pending, setPending] = useState({});
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await User.me();
        if (me.role !== "admin") {
          navigate(createPageUrl("Discover"), { replace: true });
          return;
        }
        const all = await base44.entities.User.list("-created_date", 2000);
        if (cancelled) return;
        setUsers(Array.isArray(all) ? all : []);
      } catch {
        if (!cancelled) navigate(createPageUrl("Discover"), { replace: true });
        return;
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return users;
    return users.filter((u) => {
      const haystack = `${u.full_name || ""} ${u.email || ""} ${u.id || ""}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [users, query]);

  const setUserPlus = (userId, value) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_ruumr_plus: value } : u)));
  };

  const handleGrant = async (user) => {
    setPending((prev) => ({ ...prev, [user.id]: "grant" }));
    setFeedback(null);
    try {
      // Server first: if the service grant fails we must NOT flip the Base44
      // flag, or the user would see Plus with no recommendations.
      await grantRuumrPlusEntitlement({ userId: user.id });
      await base44.entities.User.update(user.id, { is_ruumr_plus: true });
      setUserPlus(user.id, true);
      setFeedback({ type: "ok", text: `Plus הופעל עבור ${user.full_name || user.email}` });
    } catch (error) {
      setFeedback({ type: "error", text: `שגיאה בהפעלת Plus: ${error?.message || "לא ידוע"}` });
    } finally {
      setPending((prev) => {
        const next = { ...prev };
        delete next[user.id];
        return next;
      });
    }
  };

  const handleRevoke = async (user) => {
    setPending((prev) => ({ ...prev, [user.id]: "revoke" }));
    setFeedback(null);
    try {
      // Flip the Base44 flag first so the client paywall re-engages even if the
      // service revoke is slow; then revoke the service entitlement.
      await base44.entities.User.update(user.id, { is_ruumr_plus: false });
      setUserPlus(user.id, false);
      await revokeRuumrPlusEntitlement({ userId: user.id });
      setFeedback({ type: "ok", text: `Plus בוטל עבור ${user.full_name || user.email}` });
    } catch (error) {
      setFeedback({ type: "error", text: `שגיאה בביטול Plus: ${error?.message || "לא ידוע"}` });
    } finally {
      setPending((prev) => {
        const next = { ...prev };
        delete next[user.id];
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[--theme-orange]" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-6 h-6 text-[--theme-orange]" />
          <h1 className="text-2xl font-black text-gray-900">ניהול Ruumr Plus</h1>
        </div>
        <p className="text-sm text-gray-500 mb-5">
          הפעלה מסנכרנת את הדגל ב-Base44 ואת ההרשאה בשרת Plus בלחיצה אחת.
        </p>

        <div className="relative mb-4">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש לפי שם, אימייל או מזהה"
            className="w-full h-11 rounded-xl border border-gray-200 bg-white pr-10 pl-4 text-sm outline-none focus:border-[--theme-orange]"
          />
        </div>

        {feedback && (
          <div
            className={`mb-4 rounded-xl px-4 py-3 text-sm font-medium ${
              feedback.type === "ok"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                : "bg-red-50 text-red-700 border border-red-100"
            }`}
          >
            {feedback.text}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 divide-y divide-gray-100">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">לא נמצאו משתמשים</div>
          ) : (
            filtered.slice(0, 100).map((user) => {
              const busy = pending[user.id];
              const isPlus = Boolean(user.is_ruumr_plus);
              return (
                <div key={user.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 truncate">{user.full_name || "ללא שם"}</span>
                      {isPlus && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-bold text-[--theme-orange]">
                          <Check className="w-3 h-3" />
                          Plus
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 truncate">{user.email || user.id}</div>
                  </div>

                  {isPlus ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={Boolean(busy)}
                      onClick={() => handleRevoke(user)}
                      className="h-9 rounded-full px-4 text-sm font-bold border-gray-300 text-gray-700"
                    >
                      {busy === "revoke" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <X className="w-4 h-4 ml-1" />
                          בטל Plus
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      disabled={Boolean(busy)}
                      onClick={() => handleGrant(user)}
                      className="h-9 rounded-full px-4 text-sm font-bold bg-[--theme-orange] text-white hover:brightness-110"
                    >
                      {busy === "grant" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 ml-1" />
                          הפעל Plus
                        </>
                      )}
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {filtered.length > 100 && (
          <p className="mt-3 text-center text-xs text-gray-400">
            מוצגים 100 הראשונים — צמצם/י את החיפוש כדי למצוא משתמש ספציפי.
          </p>
        )}
      </div>
    </div>
  );
}
