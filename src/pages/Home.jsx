import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Navigate } from "react-router-dom";
import Discover from "@/pages/Discover";
import ApartmentDiscoveryPanel from "@/components/team/ApartmentDiscoveryPanel";
import { User } from "@/entities/User";
import { Profile } from "@/entities/Profile";
import { isRuumrSimulatorMode } from "@/lib/simulatorMode";
import { isDemoApartmentServicesStage, isDemoApartmentStage } from "@/lib/demoStage";

function publishTeamBuildingLifecycle() {
  try {
    window.localStorage?.setItem("ruumr_apartment_lifecycle", "TEAM_BUILDING");
    window.dispatchEvent(new CustomEvent("ruumr-apartment-lifecycle", { detail: { lifecycle: "TEAM_BUILDING" } }));
  } catch {
    // Best-effort nav hint only.
  }
}

function establishedTeamCount(profile) {
  return 1 + (profile?.team_members || []).filter((member) => !member.pending).length;
}

function apartmentFlowAllowed(user, profile) {
  void user;
  void profile;
  return isRuumrSimulatorMode() && isDemoApartmentStage();
}

export default function Home() {
  const { t } = useTranslation();
  const [state, setState] = useState({ loading: true, userId: "", established: false });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const user = await User.me();
        const profiles = await Profile.filter({ user_id: user.id });
        const profile = profiles[0] || null;
        const count = establishedTeamCount(profile);
        const target = Number(profile?.team_target || 3);
        const forceDemoStage2 = isRuumrSimulatorMode() && isDemoApartmentStage();
        const established = forceDemoStage2 || (count >= 2 && count >= target && apartmentFlowAllowed(user, profile));
        if (!cancelled) {
          if (!established) {
            publishTeamBuildingLifecycle();
          }
          setState({
            loading: false,
            userId: user.id,
            established,
          });
        }
      } catch (error) {
        console.error("[ruumr] Home lifecycle load failed", error);
        if (!cancelled) setState({ loading: false, userId: "", established: false });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500 font-bold">
          <Loader2 className="w-5 h-5 animate-spin text-[--theme-orange]" />
          {t("loading")}
        </div>
      </div>
    );
  }

  if (isRuumrSimulatorMode() && isDemoApartmentServicesStage()) {
    return <Navigate to="/ApartmentServices" replace />;
  }

  if (state.established) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <ApartmentDiscoveryPanel userId={state.userId} isEstablished />
      </div>
    );
  }

  return <Discover />;
}
