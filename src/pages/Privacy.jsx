import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Database, Lock, UserRound, Sparkles } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { PremiumCard, PremiumPageFrame, PremiumPill, PremiumStat } from "@/components/shared/PremiumPageFrame";

const POLICY_SECTIONS = [
  {
    no: "01",
    title: "אילו נתונים אנחנו אוספים",
    icon: Database,
    body: "מידע שמוזן ישירות בפרופיל, כמו שם, דוא״ל, טלפון, תמונות, העדפות מגורים ונתוני התאמה שנועדו לשפר את החוויה.",
  },
  {
    no: "02",
    title: "איך אנחנו משתמשים בהם",
    icon: Sparkles,
    body: "המידע משמש להפעלת השירות, התאמת שותפים, שמירת הודעות, ושיפור החוויה. אנחנו לא מוכרים מידע אישי לצדדים שלישיים.",
  },
  {
    no: "03",
    title: "איך אנחנו מגנים עליך",
    icon: Lock,
    body: "אנחנו מפעילים אמצעי אבטחה סבירים כדי לצמצם חשיפה בלתי מורשית. כמו בכל שירות אונליין, אין הגנה מוחלטת ולכן חשוב לשמור גם על סיסמאות מאובטחות.",
  },
  {
    no: "04",
    title: "שליטה ומחיקה",
    icon: UserRound,
    body: "אפשר לעדכן או למחוק מידע דרך ההגדרות. אם תרצה/י מחיקה מלאה, יש לנו מסלול מסודר שמטפל גם בפרטי הכניסה.",
  },
];

export default function PrivacyPage() {
  return (
    <PremiumPageFrame
      icon={ShieldCheck}
      eyebrow="שקיפות ובקרה"
      title="מדיניות פרטיות"
      subtitle="הנה הסיפור הקצר והישיר: מה נאסף, למה זה משמש, ואיך שומרים על המידע שלך בטוח וברור."
      backTo={createPageUrl("Settings")}
      backLabel="חזרה להגדרות"
      badge={<PremiumPill tone="orange">עודכן: 20/12/2025</PremiumPill>}
      actions={<PremiumPill tone="neutral">Hebrew first</PremiumPill>}
    >
      <PremiumCard>
        <div className="grid gap-3 sm:grid-cols-3">
          <PremiumStat label="אסיפה" value="מינימלית" tone="orange" />
          <PremiumStat label="שימוש" value="שקוף" tone="blue" />
          <PremiumStat label="שליטה" value="שלך" tone="emerald" />
        </div>
      </PremiumCard>

      <PremiumCard>
        <p className="text-right text-sm font-bold text-[--theme-orange]">למה זה חשוב?</p>
        <p className="mt-3 text-right text-sm leading-7 text-slate-600">
          אנחנו מאמינים שפרטיות טובה נבנית משקיפות. לכן ריכזנו את המדיניות למסמך קצר, קריא, ומבוסס על מה שבאמת קורה במוצר.
        </p>
      </PremiumCard>

      <div className="space-y-3">
        {POLICY_SECTIONS.map((section) => {
          const SectionIcon = section.icon;

          return (
            <PremiumCard key={section.no}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-[--theme-orange] ring-1 ring-orange-100">
                    <SectionIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 text-right">
                    <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-slate-400">{section.no}</p>
                    <h2 className="mt-1 text-xl font-black text-slate-950">{section.title}</h2>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{section.body}</p>
                  </div>
                </div>
              </div>
            </PremiumCard>
          );
        })}
      </div>

      <PremiumCard>
        <div className="flex items-center justify-between gap-4">
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-[--theme-orange]">Support</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">יש שאלה על פרטיות?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              אפשר לפנות דרך מרכז העזרה, דרך WhatsApp, או דרך ההגדרות אם תרצה/י למחוק מידע.
            </p>
          </div>
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.35rem] bg-orange-50 text-[--theme-orange] ring-1 ring-orange-100">
            <Sparkles className="h-6 w-6" />
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Link to={createPageUrl("HelpCenter")}>
            <Button className="w-full rounded-[18px] bg-[linear-gradient(135deg,#ff8a4c_0%,#ff5f2f_100%)] text-white shadow-[0_18px_40px_rgba(255,122,69,0.28)]">
              מרכז עזרה
            </Button>
          </Link>
          <a href="https://wa.me/972548523140" target="_blank" rel="noreferrer">
            <Button variant="ghost" className="w-full rounded-[18px] border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50">
              WhatsApp
            </Button>
          </a>
        </div>
      </PremiumCard>
    </PremiumPageFrame>
  );
}
