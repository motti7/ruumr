import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Mail, Loader2, Send, Users } from "lucide-react";

const OWNER_EMAIL = "mottishif7@gmail.com";

export default function ProfileCampaign() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const isOwner = user && (user.role === "admin" || user.email === OWNER_EMAIL);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (!isOwner) return;
    base44.functions
      .invoke("sendCompleteProfileCampaign", { dry_run: true, limit: 1 })
      .then((res) => setStats(res.data))
      .catch(() => setStats(null));
  }, [isOwner]);

  const sendPreview = async () => {
    setBusy(true);
    setStatus("שולח תצוגה מקדימה...");
    try {
      const res = await base44.functions.invoke("sendCompleteProfileCampaign", { preview: true });
      setStatus(
        res.data?.result?.success === false
          ? `התצוגה לא נשלחה (${res.data.result.reason || "שגיאה"})`
          : `התצוגה נשלחה למייל שלך: ${res.data?.to || user?.email}`
      );
    } catch (e) {
      setStatus("שליחת התצוגה נכשלה");
    }
    setBusy(false);
  };

  const sendToAll = async () => {
    setBusy(true);
    let offset = 0;
    let sent = 0;
    let skipped = 0;
    let guard = 0;
    try {
      while (guard < 20) {
        guard += 1;
        setStatus(`שולח... ${sent} נשלחו עד כה`);
        const res = await base44.functions.invoke("sendCompleteProfileCampaign", { offset, limit: 60 });
        sent += Number(res.data?.sent || 0);
        skipped += Number(res.data?.skipped || 0);
        if (res.data?.next_offset == null) break;
        offset = res.data.next_offset;
      }
      setStatus(`הסתיים: ${sent} נשלחו, ${skipped} דולגו`);
    } catch (e) {
      setStatus(`השליחה נעצרה אחרי ${sent} מיילים`);
    }
    setBusy(false);
  };

  if (!user) {
    return <div className="p-6 text-center text-sm text-gray-500">טוען...</div>;
  }

  if (!isOwner) {
    return <div className="p-6 text-center text-sm text-gray-500">העמוד הזה זמין לבעל האפליקציה בלבד.</div>;
  }

  return (
    <div className="p-4 pb-10" dir="rtl">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <Mail className="w-5 h-5 text-[--theme-orange]" />
          <h1 className="text-lg font-extrabold text-gray-900 dark:text-white">מייל השלמת פרופיל</h1>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          נשלח לכל מי שנרשם אבל עוד לא השלים פרופיל מלא (אין פרופיל, או חסרים תמונות, תיאור ואזורי חיפוש).
        </p>

        <div className="mt-4 flex items-center gap-2 rounded-xl bg-orange-50 dark:bg-gray-900 px-4 py-3">
          <Users className="w-5 h-5 text-[--theme-orange]" />
          <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
            {stats ? `${stats.total_recipients} ממתינים למייל` : "בודק כמה ממתינים..."}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3">
          <Button onClick={sendPreview} disabled={busy} variant="outline" className="h-12 rounded-xl font-bold">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            שלח לי תצוגה מקדימה למייל
          </Button>
          <Button
            onClick={sendToAll}
            disabled={busy}
            className="h-12 rounded-xl font-bold bg-[--theme-orange] hover:bg-[--theme-orange-dark] text-white"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            שלח לכולם
          </Button>
        </div>

        {status && <p className="mt-4 text-sm text-center text-gray-600 dark:text-gray-300">{status}</p>}
      </div>
    </div>
  );
}