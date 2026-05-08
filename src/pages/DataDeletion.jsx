import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, CheckCircle2, ShieldAlert } from "lucide-react";
import { createPageUrl } from "@/utils";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { clearClientUserData } from "@/lib/clientSessionCleanup";
import { PremiumCard, PremiumPageFrame, PremiumPill, PremiumStat } from "@/components/shared/PremiumPageFrame";

export default function DataDeletionPage() {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      alert("אנא הסבר/י את הסיבה למחיקה");
      return;
    }

    if (!confirm("האם את/ה בטוח/ה שברצונך למחוק את החשבון לצמיתות? פעולה זו בלתי הפיכה.")) {
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await User.me();
      await base44.functions.invoke("deleteAccount", {});
      
      // Send email to admin to delete Google login credentials
      await base44.integrations.Core.SendEmail({
        to: "moti.yeheskel@gmail.com",
        subject: `מחיקת פרטי כניסה גוגל - ${user.email}`,
        body: `
          משתמש מחק את חשבונו ומבקש למחוק גם את פרטי הכניסה עם גוגל.
          
          פרטי המשתמש:
          - אימייל: ${user.email}
          - שם: ${user.full_name}
          - תאריך הצטרפות: ${new Date(user.created_date).toLocaleDateString('he-IL')}
          
          סיבת המחיקה:
          ${reason}
          
          יש למחוק את פרטי הכניסה עם גוגל של משתמש זה.
        `
      });

      setSubmitted(true);
      
      // Logout after 3 seconds
      setTimeout(() => {
        clearClientUserData();
        User.logout();
        window.location.href = createPageUrl('Home');
      }, 3000);
      
    } catch (error) {
      console.error(error);
      alert("שגיאה במחיקת החשבון. נסה שוב.");
    }
    setIsSubmitting(false);
  };

  if (submitted) {
    return (
      <PremiumPageFrame
        icon={CheckCircle2}
        eyebrow="נשלח בהצלחה"
        title="החשבון נמחק"
        subtitle="הנתונים הוסרו מהמערכת והבקשה למחיקת פרטי הכניסה נשלחה לטיפול."
        backTo={createPageUrl("Settings")}
        backLabel="חזרה להגדרות"
        badge={<PremiumPill tone="emerald">המחיקה הושלמה</PremiumPill>}
      >
        <PremiumCard>
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <p className="mt-5 text-center text-sm leading-7 text-slate-600">
            נשמור את הבקשה לסנכרון פרטי הכניסה, ואז ננקה את הסשן המקומי כדי שלא תישאר/י מחובר/ת בטעות.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <PremiumStat label="פרופיל" value="נמחק" tone="emerald" />
            <PremiumStat label="הודעות" value="נוקו" tone="blue" />
            <PremiumStat label="כניסה" value="בטיפול" tone="orange" />
          </div>
        </PremiumCard>

        <PremiumCard>
          <Link to={createPageUrl("Settings")}>
            <Button className="w-full rounded-[18px] bg-[linear-gradient(135deg,#ff8a4c_0%,#ff5f2f_100%)] text-white shadow-[0_18px_40px_rgba(255,122,69,0.28)]">
              חזרה להגדרות
            </Button>
          </Link>
        </PremiumCard>
      </PremiumPageFrame>
    );
  }

  return (
    <PremiumPageFrame
      icon={Trash2}
      eyebrow="מחיקה מלאה"
      title="בקשת מחיקת נתונים"
      subtitle="זהו מסלול סופי שמסיר את כל המידע האישי, ההתאמות, התמונות ונתוני ההתחברות שלך."
      backTo={createPageUrl("Settings")}
      backLabel="חזרה להגדרות"
      badge={<PremiumPill tone="rose">פעולה בלתי הפיכה</PremiumPill>}
      actions={<PremiumPill tone="neutral">נדרשת סיבה</PremiumPill>}
    >
      <PremiumCard>
        <div className="grid gap-3 sm:grid-cols-3">
          <PremiumStat label="קצב" value="מיידי" tone="rose" />
          <PremiumStat label="בטיחות" value="גבוהה" tone="orange" />
          <PremiumStat label="שחזור" value="לא קיים" tone="blue" />
        </div>

        <div className="mt-5 rounded-[1.5rem] bg-rose-50/80 p-4 text-right ring-1 ring-rose-100">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
            <div>
              <p className="text-sm font-bold text-rose-700">מחיקה מלאה וסופית</p>
              <p className="mt-2 text-sm leading-7 text-rose-900/80">
                הבקשה תמחק את כל הנתונים הקשורים אליך מהמערכת, כולל פרופיל, תמונות, התאמות, הודעות, העדפות ופרטי כניסה.
              </p>
            </div>
          </div>
        </div>
      </PremiumCard>

      <PremiumCard>
        <label className="mb-2 block text-right text-sm font-bold text-slate-700">
          אנא הסבר/י בקצרה למה תרצה/י למחוק את החשבון
        </label>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="למשל: לא מצאתי שותפים, החוויה לא התאימה לי, או שיש לי שיקולי פרטיות..."
          className="min-h-32 rounded-[1.35rem] border-slate-200 bg-white/90 text-right shadow-sm focus-visible:ring-[--theme-orange]"
          disabled={isSubmitting}
        />
      </PremiumCard>

      <PremiumCard>
        <p className="text-right text-sm font-bold text-[--theme-orange]">מה קורה אחרי המחיקה?</p>
        <ul className="mt-3 space-y-2 text-right text-sm leading-7 text-slate-600">
          <li>• הפרופיל, התמונות וההתאמות יוסרו מיידית.</li>
          <li>• פרטי הכניסה והקישור ל-Google יעברו למחיקה משנית.</li>
          <li>• לא תוכל/י להתחבר לחשבון הזה יותר.</li>
          <li>• הבקשה היא סופית ולא ניתנת לשחזור.</li>
        </ul>
      </PremiumCard>

      <PremiumCard>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !reason.trim()}
          className="w-full rounded-[18px] bg-[linear-gradient(135deg,#ef4444_0%,#dc2626_100%)] text-white shadow-[0_18px_40px_rgba(239,68,68,0.22)] hover:opacity-95"
        >
          {isSubmitting ? "שולח בקשה..." : "שלח בקשת מחיקה"}
        </Button>
      </PremiumCard>
    </PremiumPageFrame>
  );
}
