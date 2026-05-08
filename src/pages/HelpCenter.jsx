import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  HelpCircle,
  Lock,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const faqs = [
  {
    id: "matching",
    question: "איך עובד תהליך ההתאמה?",
    answer:
      "כששני משתמשים מסמנים לייק אחד לשני, נוצרת התאמה. מרגע הזה אפשר להמשיך לשיחה מתוך עמוד Matches ולשמור את כל ההקשר במקום אחד.",
  },
  {
    id: "profile",
    question: "איך אני עורך/ת את הפרופיל שלי?",
    answer:
      "נכנסים לעמוד Profile, לוחצים על ערוך, ומעדכנים את הפרטים שרוצים. זה המקום לשנות תמונות, טקסטים, העדפות ופרטים על הדירה.",
  },
  {
    id: "permissions",
    question: "מי יכול לראות אותי בחיפוש?",
    answer:
      "ב-Permissions אפשר להחליט אם להופיע בחיפושים, האם להציג סטטוס פעיל, ואילו התראות לשמור דלוקות. זה נותן שליטה מלאה בלי להרגיש מסובך.",
  },
  {
    id: "safety",
    question: "מה עושים אם משהו מרגיש לא תקין?",
    answer:
      "פונים אלינו מיד דרך צור קשר ב-WhatsApp, ומתארים בקצרה מה קרה. אם צריך, אפשר גם להמשיך מה-Settings לתנאים או לניהול ההרשאות.",
  },
];

const quickLinks = [
  {
    to: createPageUrl("Permissions"),
    eyebrow: "פרטיות",
    title: "ניהול הרשאות",
    description: "שליטה בנראות, נוכחות והתראות.",
    icon: <Lock className="h-5 w-5" />,
  },
  {
    to: createPageUrl("Terms"),
    eyebrow: "משפטי",
    title: "תנאי שימוש",
    description: "הגרסה הקצרה והקריאה של הכללים.",
    icon: <ShieldCheck className="h-5 w-5" />,
  },
  {
    to: createPageUrl("Settings"),
    eyebrow: "חשבון",
    title: "הגדרות",
    description: "התראות, הרשאות וניהול חשבון.",
    icon: <Sparkles className="h-5 w-5" />,
  },
];

const chipStyles = {
  orange: "bg-orange-50 text-[--theme-orange] ring-orange-100",
  slate: "bg-slate-100 text-slate-600 ring-slate-200",
};

function Chip({ children, tone = "slate" }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ${chipStyles[tone] || chipStyles.slate}`}>
      {children}
    </span>
  );
}

function HelpCard({ item, isOpen, onToggle }) {
  return (
    <div className="rounded-[24px] border border-slate-100 bg-white/92 p-4 shadow-sm" dir="rtl">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 text-right"
      >
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900">{item.question}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            FAQ
          </p>
        </div>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="pt-3 text-sm leading-7 text-slate-600">{item.answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LinkCard({ to, eyebrow, title, description, icon }) {
  return (
    <Link
      to={to}
      className="group rounded-[24px] border border-white/70 bg-white/92 p-4 shadow-[0_16px_50px_rgba(15,23,42,0.08)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 text-right">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[--theme-orange]">{eyebrow}</p>
          <h3 className="mt-2 text-base font-black tracking-tight text-slate-950">{title}</h3>
          <p className="mt-2 text-xs leading-5 text-slate-500">{description}</p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-[--theme-orange] transition-transform group-hover:scale-105">
          {icon}
        </div>
      </div>
      <div className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[--theme-orange]">
        פתח/י
        <ArrowUpRight className="h-4 w-4" />
      </div>
    </Link>
  );
}

export default function HelpCenterPage() {
  const [openFaq, setOpenFaq] = useState(faqs[0].id);

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
              <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-[--theme-orange]">מרכז תמיכה</p>
              <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">מרכז עזרה</h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                תשובות קצרות, קישורים שימושיים, ודרך אחת מהירה לפנות אלינו כשצריך יד אמיתית.
              </p>
            </div>

            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[28px] bg-[linear-gradient(135deg,#ff8a4c_0%,#ff5f2f_100%)] text-white shadow-[0_18px_40px_rgba(255,122,69,0.28)]">
              <HelpCircle className="h-8 w-8" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-[1.3rem] bg-slate-100/90 px-3 py-3 text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">מהיר</p>
              <p className="mt-1 text-xl font-black text-slate-950">מענה</p>
            </div>
            <div className="rounded-[1.3rem] bg-orange-50/90 px-3 py-3 text-right ring-1 ring-orange-100">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[--theme-orange]">אנושי</p>
              <p className="mt-1 text-xl font-black text-slate-950">עוזר</p>
            </div>
            <div className="rounded-[1.3rem] bg-white px-3 py-3 text-right ring-1 ring-slate-200">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">בטוח</p>
              <p className="mt-1 text-xl font-black text-slate-950">קודם</p>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-white/70 bg-white/78 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-[--theme-orange]">גישה מהירה</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">קיצורי דרך</h2>
            </div>
            <MessageCircle className="h-5 w-5 text-[--theme-orange]" />
          </div>

          <div className="mt-4 space-y-3">
            {quickLinks.map((item) => (
              <LinkCard key={item.title} {...item} />
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 rounded-[2rem] border border-white/70 bg-white/78 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl"
        >
          <div className="flex items-center justify-between gap-3">
            <Chip tone="orange">שאלות</Chip>
            <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-slate-400">נפוצות</p>
          </div>

          {faqs.map((item) => (
            <HelpCard
              key={item.id}
              item={item}
              isOpen={openFaq === item.id}
              onToggle={() => setOpenFaq((current) => (current === item.id ? "" : item.id))}
            />
          ))}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[28px] border border-orange-100 bg-orange-50/80 p-4 shadow-[0_18px_50px_rgba(255,122,69,0.08)]"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-[--theme-orange]">צריך/ה עוד עזרה?</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">פונים אלינו ישירות</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                אם לא מצאת את התשובה, אפשר לפתוח שיחה ב-WhatsApp ולתת לנו את הפרטים בקצרה.
              </p>
            </div>
            <Sparkles className="h-5 w-5 text-[--theme-orange]" />
          </div>

          <a
            href="https://wa.me/972548523140"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[--theme-orange] px-5 py-3 text-sm font-bold text-white shadow-[0_14px_30px_rgba(255,122,69,0.24)]"
          >
            <MessageCircle className="h-4 w-4" />
            פתח/י WhatsApp
          </a>
        </motion.section>
      </div>
    </div>
  );
}
