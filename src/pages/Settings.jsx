import React, { useEffect, useState } from "react";
import { User } from "@/entities/User";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Bell,
  ChevronLeft,
  HelpCircle,
  Heart,
  Lock,
  LogOut,
  Shield,
  Sparkles,
  Trash2,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import TinderSwitch from "../components/shared/TinderSwitch";
import DeleteAccountModal from "../components/settings/DeleteAccountModal";
import { useAuth } from "@/lib/AuthContext";
import { enableSimulatorBackend, getSimulatorBackendState } from "@/lib/simulatorBackend";
import { isRuumrSimulatorMode } from "@/lib/simulatorMode";

const RowShell = ({ icon, title, description, action }) => (
  <div className="flex items-center justify-between gap-4 rounded-[24px] border border-slate-100 bg-white/90 px-4 py-4 shadow-sm">
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-[--theme-orange]">
        {icon}
      </div>
      <div className="min-w-0 text-right">
        <p className="text-sm font-bold text-slate-900">{title}</p>
        {description && <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>}
      </div>
    </div>
    {action ? <div className="shrink-0">{action}</div> : null}
  </div>
);

const SettingRow = ({ icon, title, description, action, isLink, to, href, target, rel, onClick }) => {
  const content = <RowShell icon={icon} title={title} description={description} action={action} />;

  if (href) {
    return (
      <a href={href} target={target} rel={rel} className="block">
        {content}
      </a>
    );
  }

  if (isLink) {
    return (
      <Link to={to} className="block">
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="block w-full text-right">
        {content}
      </button>
    );
  }

  return <div>{content}</div>;
};

const SectionCard = ({ eyebrow, title, subtitle, children }) => (
  <div className="rounded-[2rem] border border-white/70 bg-white/78 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl">
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="text-right">
        <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-[--theme-orange]">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{title}</h2>
        {subtitle && <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>}
      </div>
      <div className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-500">
        Premium
      </div>
    </div>
    <div className="space-y-3">{children}</div>
  </div>
);

function LoadingState() {
  return (
    <div className="rounded-[2rem] border border-white/70 bg-white/78 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl">
      <div className="h-4 w-28 rounded-full bg-slate-100" />
      <div className="mt-4 h-14 rounded-[24px] bg-slate-100" />
      <div className="mt-3 h-14 rounded-[24px] bg-slate-100" />
      <div className="mt-6 h-24 rounded-[24px] bg-slate-100" />
    </div>
  );
}

export default function SettingsPage() {
  const { logout } = useAuth();
  const [currentUser, setCurrentUser] = useState(null);
  const [notifyLikes, setNotifyLikes] = useState(true);
  const [notifyMatches, setNotifyMatches] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        if (isRuumrSimulatorMode()) {
          enableSimulatorBackend(base44);
        }

        let userData = null;
        try {
          userData = await User.me();
        } catch (error) {
          const simulatorState = getSimulatorBackendState();
          if (simulatorState?.currentUser) {
            userData = simulatorState.currentUser;
          } else {
            throw error;
          }
        }

        setCurrentUser(userData);
        setNotifyLikes(userData?.notify_likes !== false);
        setNotifyMatches(userData?.notify_matches !== false);
      } catch (error) {
        console.error("Failed to load user settings:", error);
        const simulatorState = getSimulatorBackendState();
        if (simulatorState?.currentUser) {
          setCurrentUser(simulatorState.currentUser);
          setNotifyLikes(simulatorState.currentUser.notify_likes !== false);
          setNotifyMatches(simulatorState.currentUser.notify_matches !== false);
        }
      }
      setIsLoading(false);
    };

    load();
  }, []);

  const handleNotifyLikesChange = async (val) => {
    setNotifyLikes(val);
    try {
      await base44.auth.updateMe({ notify_likes: val });
    } catch (error) {
      setNotifyLikes(!val);
    }
  };

  const handleNotifyMatchesChange = async (val) => {
    setNotifyMatches(val);
    try {
      await base44.auth.updateMe({ notify_matches: val });
    } catch (error) {
      setNotifyMatches(!val);
    }
  };

  const handleLogout = async () => {
    await logout(true);
  };

  const initials = (currentUser?.full_name || currentUser?.name || "R")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "R")
    .join("") || "R";

  if (isLoading) {
    return (
      <div className="relative min-h-[100dvh] overflow-hidden px-4 pt-4 pb-28" dir="rtl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top_left,_rgba(255,111,63,0.14),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.9),_transparent_26%),linear-gradient(180deg,_rgba(255,255,255,0.64)_0%,_rgba(255,255,255,0.05)_100%)]" />
        <div className="mx-auto max-w-md">
          <LoadingState />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] overflow-hidden px-4 pt-4 pb-28" dir="rtl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top_left,_rgba(255,111,63,0.14),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.9),_transparent_26%),linear-gradient(180deg,_rgba(255,255,255,0.64)_0%,_rgba(255,255,255,0.05)_100%)]" />

      <DeleteAccountModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} />

      <div className="mx-auto max-w-md space-y-4">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-white/70 bg-white/78 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[28px] bg-[linear-gradient(135deg,#ff8a4c_0%,#ff5f2f_100%)] text-lg font-black text-white shadow-[0_18px_40px_rgba(255,122,69,0.28)]">
                {initials}
              </div>
              <div className="min-w-0 text-right">
                <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-[--theme-orange]">Control center</p>
                <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">הגדרות</h1>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {currentUser?.full_name || currentUser?.name || "חשבון Ruumr שלך"}
                </p>
                {currentUser?.email && (
                  <p className="mt-1 text-xs font-medium text-slate-400">{currentUser.email}</p>
                )}
              </div>
            </div>
            <div className="rounded-full bg-orange-50 px-3 py-1 text-[11px] font-bold text-[--theme-orange] ring-1 ring-orange-100">
              <Sparkles className="mr-1 inline h-3.5 w-3.5" />
              Premium
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-[1.3rem] bg-slate-100/90 px-3 py-3 text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">Likes</p>
              <p className="mt-1 text-xl font-black text-slate-950">{notifyLikes ? "On" : "Off"}</p>
            </div>
            <div className="rounded-[1.3rem] bg-orange-50/90 px-3 py-3 text-right ring-1 ring-orange-100">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[--theme-orange]">Matches</p>
              <p className="mt-1 text-xl font-black text-slate-950">{notifyMatches ? "On" : "Off"}</p>
            </div>
            <div className="rounded-[1.3rem] bg-white px-3 py-3 text-right ring-1 ring-slate-200">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">Status</p>
              <p className="mt-1 text-xl font-black text-slate-950">Ready</p>
            </div>
          </div>
        </motion.section>

        <SectionCard
          eyebrow="Notifications"
          title="התראות"
          subtitle="בוחרים כמה רעש, באיזה רגע, ואיפה. הכל נשאר אלגנטי."
        >
          <SettingRow
            icon={<Heart className="h-5 w-5" />}
            title="לייקים חדשים"
            description="נודיע כשמישהו מסמן אותך כדי שלא תפספס/י חיבור טוב."
            action={<TinderSwitch key={`likes-${notifyLikes}`} defaultChecked={notifyLikes} onChange={handleNotifyLikesChange} />}
          />
          <SettingRow
            icon={<Bell className="h-5 w-5" />}
            title="התאמות והודעות חדשות"
            description="התראה כשנפתח צ'אט או נוצרת התאמה חדשה."
            action={<TinderSwitch key={`matches-${notifyMatches}`} defaultChecked={notifyMatches} onChange={handleNotifyMatchesChange} />}
          />
        </SectionCard>

        <SectionCard
          eyebrow="Account"
          title="חשבון"
          subtitle="הרשאות, פרטיות והגדרות שמחזיקות את החוויה חלקה."
        >
          <SettingRow
            icon={<Lock className="h-5 w-5" />}
            title="ניהול הרשאות"
            description="מצלמה, מיקום והודעות. הכל במקום אחד."
            action={<ChevronLeft className="text-slate-400" />}
            isLink
            to={createPageUrl("Permissions")}
          />
          <SettingRow
            icon={<Shield className="h-5 w-5" />}
            title="מדיניות פרטיות"
            description="מה נאסף, למה זה משמש, ואיך שומרים על המידע שלך."
            action={<ChevronLeft className="text-slate-400" />}
            isLink
            to={createPageUrl("Privacy")}
          />
          <SettingRow
            icon={<Trash2 className="h-5 w-5" />}
            title="מחיקת נתונים"
            description="מסלול מלא למחיקה סופית של החשבון והמידע."
            action={<ChevronLeft className="text-slate-400" />}
            isLink
            to={createPageUrl("DataDeletion")}
          />
        </SectionCard>

        <SectionCard
          eyebrow="Support"
          title="תמיכה"
          subtitle="אם צריך עזרה, הסברים או פשוט מענה מהיר, זה המקום."
        >
          <SettingRow
            icon={<HelpCircle className="h-5 w-5" />}
            title="מרכז עזרה"
            description="מדריכים, שאלות נפוצות והכוונה מהירה."
            action={<ChevronLeft className="text-slate-400" />}
            isLink
            to={createPageUrl("HelpCenter")}
          />
          <SettingRow
            icon={<Shield className="h-5 w-5" />}
            title="תנאי שימוש"
            description="האותיות הקטנות, בניסוח שלא גורם לכאב ראש."
            action={<ChevronLeft className="text-slate-400" />}
            isLink
            to={createPageUrl("Terms")}
          />
          <SettingRow
            icon={<img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" className="h-5 w-5" alt="WhatsApp" />}
            title="צור קשר"
            description="תמיכה מהירה ב-WhatsApp."
            action={<ArrowUpRight className="h-4 w-4 text-slate-400" />}
            href="https://wa.me/972548523140"
            target="_blank"
            rel="noopener noreferrer"
          />
        </SectionCard>

        <div className="rounded-[2rem] border border-white/70 bg-white/82 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl">
          <p className="text-right text-sm font-bold text-slate-900">פעולות חשבון</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="min-h-[52px] w-full rounded-[18px] border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
              aria-label="התנתקות"
            >
              <LogOut className="ml-2 h-5 w-5" />
              התנתקות
            </Button>

            <Button
              onClick={() => setShowDeleteModal(true)}
              variant="ghost"
              className="min-h-[52px] w-full rounded-[18px] border border-rose-200 bg-rose-50 text-rose-600 shadow-sm hover:bg-rose-100"
              aria-label="פתח דיאלוג מחיקת חשבון"
            >
              <Trash2 className="ml-2 h-5 w-5" />
              מחק חשבון
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
