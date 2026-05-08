import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const BACKDROP =
  "pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top_left,_rgba(255,111,63,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.88),_transparent_24%),linear-gradient(180deg,_rgba(255,255,255,0.78)_0%,_rgba(255,248,242,0.88)_40%,_rgba(255,255,255,0.04)_100%)]";

const cardClass =
  "rounded-[2rem] border border-white/80 bg-white/82 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl";

const toneClasses = {
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
  orange: "bg-orange-50 text-[--theme-orange] ring-orange-100",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  blue: "bg-blue-50 text-blue-700 ring-blue-100",
  rose: "bg-rose-50 text-rose-700 ring-rose-100",
  gold: "bg-amber-50 text-amber-700 ring-amber-100",
};

export function PremiumPageFrame({
  eyebrow,
  title,
  subtitle,
  icon: Icon,
  backTo,
  backLabel = "חזרה",
  badge,
  actions,
  children,
  className = "",
}) {
  return (
    <div className={`relative min-h-[100dvh] overflow-hidden px-4 pt-4 pb-28 ${className}`} dir="rtl">
      <div className={BACKDROP} />
      <div className="absolute left-[-8rem] top-20 h-56 w-56 rounded-full bg-orange-100/50 blur-3xl" />
      <div className="absolute right-[-6rem] top-56 h-72 w-72 rounded-full bg-rose-100/50 blur-3xl" />

      <div className="relative mx-auto max-w-2xl space-y-4">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={cardClass}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-4">
              {backTo ? (
                <Link
                  to={backTo}
                  className="mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-transform hover:scale-[1.02]"
                  aria-label={backLabel}
                >
                  <ArrowRight className="h-5 w-5" />
                </Link>
              ) : null}

              {Icon ? (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.35rem] bg-[linear-gradient(135deg,#ff8a4c_0%,#ff5f2f_100%)] text-white shadow-[0_18px_40px_rgba(255,122,69,0.28)]">
                  <Icon className="h-6 w-6" />
                </div>
              ) : null}

              <div className="min-w-0 text-right">
                {eyebrow ? (
                  <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-[--theme-orange]">
                    {eyebrow}
                  </p>
                ) : null}
                <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">{title}</h1>
                {subtitle ? <p className="mt-3 text-sm leading-6 text-slate-500">{subtitle}</p> : null}
              </div>
            </div>

            {(badge || actions) ? (
              <div className="flex shrink-0 flex-col items-end gap-2">
                {badge}
                {actions}
              </div>
            ) : null}
          </div>
        </motion.section>

        <div className="space-y-4">{children}</div>
      </div>
    </div>
  );
}

export function PremiumCard({ children, className = "" }) {
  return <div className={`${cardClass} ${className}`}>{children}</div>;
}

export function PremiumPill({ children, tone = "neutral", className = "" }) {
  const resolvedTone = toneClasses[tone] || toneClasses.neutral;

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${resolvedTone} ${className}`}>
      {children}
    </span>
  );
}

export function PremiumStat({ label, value, tone = "neutral" }) {
  const resolvedTone = toneClasses[tone] || toneClasses.neutral;

  return (
    <div className={`rounded-[1.35rem] px-4 py-3 text-right ring-1 ${resolvedTone}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.28em] opacity-70">{label}</p>
      <p className="mt-1 text-xl font-black text-slate-950">{value}</p>
    </div>
  );
}
