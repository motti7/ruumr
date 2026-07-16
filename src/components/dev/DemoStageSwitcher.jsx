import React, { useState } from "react";
import { Minus, RotateCcw } from "lucide-react";
import { isRuumrSimulatorMode } from "@/lib/simulatorMode";
import { DEMO_STAGES, getDemoStage } from "@/lib/demoStage";

// New key on purpose: any old "hidden" flag is ignored so the control always
// reappears after this update.
const COLLAPSE_KEY = "ruumr_demo_switcher_collapsed";
const STAGES = [
  { value: DEMO_STAGES.TEAM_BUILDING, label: "1" },
  { value: DEMO_STAGES.APARTMENT_SEARCH, label: "2" },
  { value: DEMO_STAGES.APARTMENT_SERVICES, label: "3" },
];
const RESET_LOCAL_STORAGE_KEYS = [
  "roomi_seen_like_ids",
  "roomi_seen_match_ids",
  "ruumr_apartment_lifecycle",
  "ruumr_discover_marker",
  "ruumr_seen_user_ids",
];
const RESET_SESSION_STORAGE_KEYS = [
  "ruumr_apartment_intro_requested",
  "ruumr_apartment_intro_seen",
  "ruumr_profile_signal_dismissed_session",
  "ruumr_plus_pending_activation",
];
const RESET_LOCAL_STORAGE_PREFIXES = [
  "ruumr_apartment_preference_draft:",
  "ruumr_plus_activation:",
  "ruumr_team_apartment_transition_confetti_seen:",
];
const RESET_SESSION_STORAGE_PREFIXES = [
  "ruumr_profile_signal_answered:",
];

function removeStorageKeys(storage, keys = [], prefixes = []) {
  if (!storage) return;
  try {
    keys.forEach((key) => storage.removeItem(key));
    const storedKeys = Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter(Boolean);
    storedKeys.forEach((key) => {
      if (prefixes.some((prefix) => key.startsWith(prefix))) {
        storage.removeItem(key);
      }
    });
  } catch {
    // Demo reset cleanup is best-effort; the backend reset flag is authoritative.
  }
}

function getWindowStorage(name) {
  if (typeof window === "undefined") return null;
  try {
    return window[name] || null;
  } catch {
    return null;
  }
}

export function resetDemoRunStorage() {
  removeStorageKeys(getWindowStorage("localStorage"), RESET_LOCAL_STORAGE_KEYS, RESET_LOCAL_STORAGE_PREFIXES);
  removeStorageKeys(getWindowStorage("sessionStorage"), RESET_SESSION_STORAGE_KEYS, RESET_SESSION_STORAGE_PREFIXES);
}

/**
 * Subtle, simulator-only control for jumping between demo stages (1/2/3).
 * Collapses to a small labelled handle (never fully disappears) so it can
 * always be reopened, and hard-navigates so the target stage re-renders.
 */
export default function DemoStageSwitcher() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === "1";
    } catch {
      return false;
    }
  });

  if (!isRuumrSimulatorMode()) return null;

  const current = String(getDemoStage() || DEMO_STAGES.TEAM_BUILDING);
  const currentLabel = STAGES.find((s) => String(s.value) === current)?.label || "1";
  const go = (value) => {
    window.location.assign(`/Home?simulator_mode=true&demo_stage=${value}`);
  };
  const resetRun = () => {
    resetDemoRunStorage();
    window.location.assign(`/Home?simulator_mode=true&demo_stage=${DEMO_STAGES.TEAM_BUILDING}&simulator_reset_state=true`);
  };
  const setCollapse = (value) => {
    try {
      if (value) localStorage.setItem(COLLAPSE_KEY, "1");
      else localStorage.removeItem(COLLAPSE_KEY);
    } catch { /* ignore */ }
    setCollapsed(value);
  };

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapse(false)}
        aria-label="Open demo stage switcher"
        className="fixed bottom-24 left-2 z-[70] flex h-7 w-7 items-center justify-center rounded-full bg-black/45 text-[11px] font-bold text-white/85 backdrop-blur-sm opacity-45 hover:opacity-100 transition-opacity"
      >
        {currentLabel}
      </button>
    );
  }

  return (
    <div
      dir="ltr"
      className="fixed bottom-24 left-2 z-[70] flex items-center gap-0.5 rounded-full bg-black/55 px-1 py-0.5 text-white shadow-lg backdrop-blur-sm opacity-85 transition-opacity hover:opacity-100 select-none"
    >
      {STAGES.map((s) => {
        const active = current === String(s.value);
        return (
          <button
            key={s.value}
            type="button"
            onClick={() => go(s.value)}
            aria-label={`Go to demo stage ${s.label}`}
            aria-current={active ? "true" : undefined}
            className={`h-6 w-6 rounded-full text-[11px] font-bold transition-colors ${
              active ? "bg-[--theme-orange] text-white" : "text-white/70 hover:text-white"
            }`}
          >
            {s.label}
          </button>
        );
      })}
      <button
        type="button"
        onClick={resetRun}
        aria-label="Reset demo run"
        title="Reset demo run"
        className="ml-0.5 flex h-6 items-center gap-1 rounded-full bg-white/95 px-2.5 text-[10px] font-extrabold text-gray-800 shadow-sm transition-colors hover:bg-white hover:text-[--theme-orange]"
      >
        <RotateCcw className="h-3 w-3" />
        Reset
      </button>
      <button
        type="button"
        onClick={() => setCollapse(true)}
        aria-label="Collapse demo stage switcher"
        className="pl-0.5 pr-1 text-white/45 hover:text-white"
      >
        <Minus className="h-3 w-3" />
      </button>
    </div>
  );
}
