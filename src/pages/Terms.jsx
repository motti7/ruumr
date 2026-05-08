import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Clock3,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const sections = [
  {
    id: "usage",
    number: "01",
    title: "שימוש באפליקציה",
    body:
      "האפליקציה מיועדת למציאת שותפים לדיור בלבד. כל משתמש נדרש להיות בן או בת 18 ומעלה, ולהשתמש בשירות בצורה שמכבדת את שאר הקהילה.",
  },
  {
    id: "content",
    number: "02",
    title: "תוכן משתמש",
    body:
      "האחריות על התמונות, הטקסטים והמידע שמעלים לפרופיל חלה על המשתמש בלבד. אסור להעלות תוכן פוגעני, מטעה, מפר או לא חוקי.",
  },
  {
    id: "privacy",
    number: "03",
    title: "פרטיות ובטיחות",
    body:
      "אנחנו מכבדים את הפרטיות שלך ושומרים מידע אישי במידה הנדרשת לצורך הפעלת השירות. מידע לא ישותף עם צדדים שלישיים ללא הסכמה, אלא אם החוק מחייב זאת.",
  },
];

const quickAnchors = [
  { href: "#usage", label: "שימוש" },
  { href: "#content", label: "תוכן" },
  { href: "#privacy", label: "פרטיות" },
];

function SectionCard({ section }) {
  return (
    <motion.section
      id={section.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="scroll-mt-6 rounded-[28px] border border-white/70 bg-white/82 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.10)] backdrop-blur-2xl"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-[--theme-orange]">{section.number}</p>
          <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{section.title}</h3>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-50 text-[--theme-orange]">
          <ShieldCheck className="h-4 w-4" />
        </div>
      </div>

      <p className="mt-3 text-sm leading-7 text-slate-600">{section.body}</p>
    </motion.section>
  );
}

export default function TermsPage() {
  const today = new Intl.DateTimeFormat("he-IL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <div className="relative min-h-[100dvh] overflow-hidden px-4 pt-4 pb-28" dir="rtl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top_left,_rgba(255,111,63,0.14),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.9),_transparent_26%),linear-gradient(180deg,_rgba(255,255,255,0.64)_0%,_rgba(255,255,255,0.05)_100%)]" />

      <div className="mx-auto max-w-md space-y-4">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-white/70 bg-white/78 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl"
        >
          <div className="flex items-start justify-between gap-4">
            <Link
              to={createPageUrl("Settings")}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/88 text-slate-600 shadow-sm ring-1 ring-slate-200"
              aria-label="חזור להגדרות"
            >
              <ArrowRight className="h-5 w-5" />
            </Link>

            <div className="min-w-0 flex-1 text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-[--theme-orange]">סטודיו משפטי</p>
              <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">תנאי שימוש</h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                גרסה קצרה וברורה יותר של הכללים. המטרה היא להבין במהירות איך להשתמש באפליקציה ומה חשוב לדעת.
              </p>
            </div>

            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[28px] bg-[linear-gradient(135deg,#ff8a4c_0%,#ff5f2f_100%)] text-white shadow-[0_18px_40px_rgba(255,122,69,0.28)]">
              <Sparkles className="h-8 w-8" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-[1.3rem] bg-slate-100/90 px-3 py-3 text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">קריא</p>
              <p className="mt-1 text-xl font-black text-slate-950">כן</p>
            </div>
            <div className="rounded-[1.3rem] bg-orange-50/90 px-3 py-3 text-right ring-1 ring-orange-100">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[--theme-orange]">עודכן</p>
              <p className="mt-1 text-lg font-black text-slate-950">{today}</p>
            </div>
            <div className="rounded-[1.3rem] bg-white px-3 py-3 text-right ring-1 ring-slate-200">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">סעיפים</p>
              <p className="mt-1 text-xl font-black text-slate-950">3</p>
            </div>
          </div>

          <div className="mt-4 rounded-[24px] border border-orange-100 bg-orange-50/80 p-4 text-right">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 text-right">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-[--theme-orange]">תקציר</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  1. האפליקציה מיועדת לשותפים לדיור. 2. מה שמעלים הוא באחריות המשתמש. 3. פרטיות נשמרת בהתאם לחוק.
                </p>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[--theme-orange] shadow-sm">
                <Clock3 className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {quickAnchors.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="inline-flex min-h-[40px] items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
              >
                {item.label}
              </a>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-white/70 bg-white/78 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-[--theme-orange]">סקירה</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">העקרונות המרכזיים</h2>
            </div>
            <MessageCircle className="h-5 w-5 text-[--theme-orange]" />
          </div>

          <div className="mt-4 space-y-3">
            {sections.map((section) => (
              <SectionCard key={section.id} section={section} />
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[28px] border border-white/70 bg-white/82 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.10)] backdrop-blur-2xl"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-[--theme-orange]">צריך/ה עזרה?</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">שאלות או בירור נוסף</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                אם תרצה/י לקרוא עוד או לשאול משהו, מרכז העזרה והתמיכה זמינים תמיד מכאן.
              </p>
            </div>
            <ArrowUpRight className="h-5 w-5 text-[--theme-orange]" />
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Link
              to={createPageUrl("HelpCenter")}
              className="inline-flex min-h-[44px] items-center justify-between rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-right shadow-sm"
            >
              <span>
                <span className="block text-sm font-bold text-slate-900">מרכז עזרה</span>
                <span className="block text-xs text-slate-500">תשובות קצרות ופשוטות</span>
              </span>
              <ArrowUpRight className="h-4 w-4 text-slate-400" />
            </Link>

            <a
              href="https://wa.me/972548523140"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center justify-between rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-right shadow-sm"
            >
              <span>
                <span className="block text-sm font-bold text-slate-900">WhatsApp</span>
                <span className="block text-xs text-slate-500">פנייה ישירה לצוות</span>
              </span>
              <ArrowUpRight className="h-4 w-4 text-slate-400" />
            </a>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
