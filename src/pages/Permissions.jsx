import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Profile } from "@/entities/Profile";
import { User } from "@/entities/User";
import { syncCurrentProfileToRuumrPlus } from "@/api/ruumrPlus";
import { base44 } from "@/api/base44Client";
import { enableSimulatorBackend, getSimulatorBackendState } from "@/lib/simulatorBackend";
import { isRuumrSimulatorMode } from "@/lib/simulatorMode";
import TinderSwitch from "../components/shared/TinderSwitch";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  EyeOff,
  MessageCircle,
  Sparkles,
  Signal,
  ShieldCheck,
} from "lucide-react";

const toneStyles = {
  orange: "bg-orange-50 text-[--theme-orange] ring-orange-100",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  slate: "bg-slate-100 text-slate-600 ring-slate-200",
  white: "bg-white text-slate-500 ring-slate-200",
};

const iconStyles = {
  orange: "bg-orange-50 text-[--theme-orange]",
  blue: "bg-sky-50 text-sky-600",
  green: "bg-emerald-50 text-emerald-600",
};

function Chip({ children, tone = "slate" }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ${toneStyles[tone] || toneStyles.slate}`}>
      {children}
    </span>
  );
}

function LoadingState() {
  return (
    <div className="rounded-[2rem] border border-white/70 bg-white/78 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl">
      <div className="h-4 w-24 rounded-full bg-slate-100" />
      <div className="mt-3 h-10 w-48 rounded-2xl bg-slate-100" />
      <div className="mt-3 h-4 w-[82%] rounded-full bg-slate-100" />
      <div className="mt-5 space-y-3">
        <div className="h-28 rounded-[24px] bg-slate-100" />
        <div className="h-28 rounded-[24px] bg-slate-100" />
        <div className="h-28 rounded-[24px] bg-slate-100" />
      </div>
    </div>
  );
}

function ToggleRow({ icon, iconTone = "orange", title, description, checked, onChange }) {
  return (
    <div className="rounded-[24px] border border-slate-100 bg-white/92 p-4 shadow-sm" dir="rtl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconStyles[iconTone] || iconStyles.orange}`}>
            {icon}
          </div>
          <div className="min-w-0 text-right">
            <p className="text-sm font-bold text-slate-900">{title}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
          <div className="mt-3">
              <Chip tone={checked ? "green" : "slate"}>{checked ? "גלוי" : "מוסתר"}</Chip>
            </div>
          </div>
        </div>

        <TinderSwitch key={`${title}-${checked}`} defaultChecked={checked} onChange={onChange} />
      </div>
    </div>
  );
}

export default function PermissionsPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [showInDiscovery, setShowInDiscovery] = useState(true);
  const [showActiveStatus, setShowActiveStatus] = useState(true);
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      setIsLoading(true);
      try {
        if (isRuumrSimulatorMode()) {
          enableSimulatorBackend(base44);
        }

        let userData = null;
        try {
          userData = await User.me();
        } catch (error) {
          userData = getSimulatorBackendState()?.currentUser || null;
          if (!userData) throw error;
        }

        let profileData = null;
        try {
          const profiles = await Profile.filter({ user_id: userData.id });
          profileData = profiles[0] || null;
        } catch {
          profileData = getSimulatorBackendState()?.collections?.Profile?.find(
            (item) => String(item.user_id) === String(userData.id)
          ) || null;
        }

        setCurrentUser(userData);
        setProfile(profileData);
        setShowInDiscovery(userData.show_in_discovery ?? profileData?.is_visible ?? true);
        setShowActiveStatus(userData.show_active_status !== false);
        setEnableNotifications(userData.enable_notifications !== false);
      } catch (error) {
        console.error("Failed to load user permissions:", error);
        const simulatorState = getSimulatorBackendState();
        if (simulatorState?.currentUser) {
          setCurrentUser(simulatorState.currentUser);
          setProfile(simulatorState.currentProfile || null);
          setShowInDiscovery(simulatorState.currentProfile?.is_visible ?? true);
          setShowActiveStatus(true);
          setEnableNotifications(simulatorState.currentUser.enable_notifications !== false);
        }
      }

      setIsLoading(false);
    };

    loadUser();
  }, []);

  const handleToggle = async (field, checked) => {
    const previous = {
      showInDiscovery,
      showActiveStatus,
      enableNotifications,
    };

    if (field === "showInDiscovery") setShowInDiscovery(checked);
    if (field === "showActiveStatus") setShowActiveStatus(checked);
    if (field === "enableNotifications") setEnableNotifications(checked);

    try {
      if (field === "showInDiscovery") {
        await User.updateMyUserData({ show_in_discovery: checked });
        if (profile?.id) {
          await Profile.update(profile.id, { is_visible: checked });
          try {
            await syncCurrentProfileToRuumrPlus();
          } catch (syncError) {
            console.error("Failed to sync visibility change to Ruumr Plus:", syncError);
          }
        }
      } else if (field === "showActiveStatus") {
        await User.updateMyUserData({ show_active_status: checked });
      } else if (field === "enableNotifications") {
        await User.updateMyUserData({ enable_notifications: checked });
      }
    } catch (error) {
      console.error("Failed to update permissions:", error);
      setShowInDiscovery(previous.showInDiscovery);
      setShowActiveStatus(previous.showActiveStatus);
      setEnableNotifications(previous.enableNotifications);
    }
  };

  const displayName = currentUser?.full_name || currentUser?.name || "החשבון שלך";
  const summaryChips = [
    { label: "נראות", value: showInDiscovery ? "גלוי" : "מוסתר", tone: showInDiscovery ? "green" : "slate" },
    { label: "נוכחות", value: showActiveStatus ? "פעיל" : "שקט", tone: showActiveStatus ? "orange" : "slate" },
    { label: "התראות", value: enableNotifications ? "פתוח" : "כבוי", tone: enableNotifications ? "orange" : "slate" },
  ];

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

      <div className="mx-auto max-w-md space-y-4">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-white/70 bg-white/78 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-[--theme-orange]">סטודיו פרטיות</p>
              <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">ניהול הרשאות</h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                {displayName} בוחר/ת מי רואה אותך, מתי רואים אותך, ואילו התראות מחזיקות את החוויה חדה ונעימה.
              </p>
            </div>

            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[28px] bg-[linear-gradient(135deg,#ff8a4c_0%,#ff5f2f_100%)] text-white shadow-[0_18px_40px_rgba(255,122,69,0.28)]">
              <ShieldCheck className="h-8 w-8" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {summaryChips.map((chip) => (
              <div
                key={chip.label}
                className={`rounded-[1.3rem] px-3 py-3 text-right ring-1 ${
                  chip.tone === "green"
                    ? "bg-emerald-50/90 ring-emerald-100"
                    : chip.tone === "orange"
                      ? "bg-orange-50/90 ring-orange-100"
                      : "bg-slate-100/90 ring-slate-200"
                }`}
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">{chip.label}</p>
                <p className="mt-1 text-xl font-black text-slate-950">{chip.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-[24px] border border-orange-100 bg-orange-50/80 p-4 text-right">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 text-right">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-[--theme-orange]">How it feels</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  השינויים נשמרים מיד. כיבוי של נראות מסתיר אותך מחיפושים, כיבוי של נוכחות מפסיק להציג סטטוס פעיל,
                  ו-התראות שולטות בהתראות הכלליות של החשבון.
                </p>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[--theme-orange] shadow-sm">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 rounded-[2rem] border border-white/70 bg-white/78 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl"
        >
          <div className="flex items-center justify-between gap-3">
            <Chip tone="orange">בקרה</Chip>
            <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-slate-400">מתגים</p>
          </div>

          <ToggleRow
            icon={<EyeOff className="h-5 w-5" />}
            iconTone="orange"
            title="הופעה בחיפושים"
            description="כיבוי האפשרות הזו הופך אותך לבלתי נראה לחיפושים עד שתחליט/י לחזור."
            checked={showInDiscovery}
            onChange={(checked) => handleToggle("showInDiscovery", checked)}
          />

          <ToggleRow
            icon={<Signal className="h-5 w-5" />}
            iconTone="blue"
            title="הצגת סטטוס פעיל"
            description="אם הפעילות פחות מעניינת אותך, אפשר להישאר שקט/ה בלי לאבד שליטה."
            checked={showActiveStatus}
            onChange={(checked) => handleToggle("showActiveStatus", checked)}
          />

          <ToggleRow
            icon={<Bell className="h-5 w-5" />}
            iconTone="green"
            title="התראות מערכת"
            description="שולט בהתראות הכלליות של האפליקציה, כדי שתישאר/י בעניינים בלי עומס."
            checked={enableNotifications}
            onChange={(checked) => handleToggle("enableNotifications", checked)}
          />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[28px] border border-white/70 bg-white/82 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.10)] backdrop-blur-2xl"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-[--theme-orange]">המשך</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">רוצה להעמיק עוד?</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                יש לנו גם תשובות פשוטות יותר ב-Help Center, ועוד פרטים על תנאי השימוש.
              </p>
            </div>
            <MessageCircle className="h-5 w-5 text-[--theme-orange]" />
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Link
              to={createPageUrl("HelpCenter")}
              className="inline-flex min-h-[44px] items-center justify-between rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-right shadow-sm"
            >
              <span>
                <span className="block text-sm font-bold text-slate-900">מרכז עזרה</span>
                <span className="block text-xs text-slate-500">שאלות נפוצות ותשובות קצרות</span>
              </span>
              <ArrowUpRight className="h-4 w-4 text-slate-400" />
            </Link>

            <Link
              to={createPageUrl("Terms")}
              className="inline-flex min-h-[44px] items-center justify-between rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-right shadow-sm"
            >
              <span>
                <span className="block text-sm font-bold text-slate-900">תנאי שימוש</span>
                <span className="block text-xs text-slate-500">גרסה נקייה וקלילה לקריאה</span>
              </span>
              <ArrowUpRight className="h-4 w-4 text-slate-400" />
            </Link>
          </div>

          <Link
            to={createPageUrl("Settings")}
            className="mt-4 inline-flex min-h-[44px] items-center gap-2 text-sm font-bold text-[--theme-orange]"
          >
            חזרה להגדרות
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.section>
      </div>
    </div>
  );
}
