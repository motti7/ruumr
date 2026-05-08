import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import RoomiCharter from '../components/charter/RoomiCharter';
import { User } from '@/entities/User';
import { PremiumCard, PremiumPill } from '@/components/shared/PremiumPageFrame';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { enableSimulatorBackend, getSimulatorBackendState } from '@/lib/simulatorBackend';
import { isRuumrSimulatorMode } from '@/lib/simulatorMode';

export default function CharterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState(null);
  const [user1Profile, setUser1Profile] = useState(null);
  const [user2Profile, setUser2Profile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadData();
  }, [location.search]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (isRuumrSimulatorMode()) {
        enableSimulatorBackend(base44);
      }

      const urlParams = new URLSearchParams(location.search);
      const matchId = urlParams.get('matchId');

      if (!matchId) {
        navigate(createPageUrl('Matches'));
        return;
      }

      if (isRuumrSimulatorMode()) {
        enableSimulatorBackend(base44);

        const simulatorState = getSimulatorBackendState();
        const simulatorMatch = simulatorState?.collections?.Match?.find((item) => String(item.id) === String(matchId)) || null;
        const simulatorProfiles = Array.isArray(simulatorState?.collections?.Profile) ? simulatorState.collections.Profile : [];
        const simulatorCurrentUser = simulatorState?.currentUser || null;

        if (!simulatorMatch || !simulatorCurrentUser) {
          navigate(createPageUrl('Matches'));
          setLoading(false);
          return;
        }

        setCurrentUser(simulatorCurrentUser);
        setMatch(simulatorMatch);
        setUser1Profile(simulatorProfiles.find((profile) => String(profile.user_id) === String(simulatorMatch.user1_id)) || null);
        setUser2Profile(simulatorProfiles.find((profile) => String(profile.user_id) === String(simulatorMatch.user2_id)) || null);
        setLoading(false);
        return;
      }

      const user = await User.me();
      setCurrentUser(user);

      const matches = await base44.entities.Match.filter({ id: matchId });
      if (matches.length === 0) {
        navigate(createPageUrl('Matches'));
        return;
      }

      const matchData = matches[0];
      setMatch(matchData);

      const profiles1 = await base44.entities.Profile.filter({ user_id: matchData.user1_id });
      const profiles2 = await base44.entities.Profile.filter({ user_id: matchData.user2_id });

      setUser1Profile(profiles1[0]);
      setUser2Profile(profiles2[0]);
    } catch (e) {
      console.error(e);
      navigate(createPageUrl('Matches'));
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[linear-gradient(180deg,#fffaf6_0%,#fff_100%)] p-4" dir="rtl">
        <PremiumCard className="max-w-sm text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-4 border-slate-200 border-t-[--theme-orange]"
          />
          <p className="mt-4 text-2xl font-black text-slate-950">טוען את שאלון ההתאמה</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">אנחנו בונים את המסלול האישי לשותפות שלך.</p>
          <div className="mt-4 flex justify-center">
            <PremiumPill tone="orange">מכין חוויה</PremiumPill>
          </div>
        </PremiumCard>
      </div>
    );
  }

  if (!match || !user1Profile || !user2Profile) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[linear-gradient(180deg,#fffaf6_0%,#fff_100%)] p-4" dir="rtl">
        <PremiumCard className="max-w-sm text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-50 text-[--theme-orange] ring-1 ring-orange-100">
            <Sparkles className="h-6 w-6" />
          </div>
          <p className="mt-4 text-2xl font-black text-slate-950">לא נמצאה התאמה</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">יכול להיות שהקישור לא תקין או שההתאמה עוד לא מוכנה להצגה.</p>
          <button
            onClick={() => navigate(createPageUrl("Matches"))}
            className="mt-5 rounded-[18px] bg-[linear-gradient(135deg,#ff8a4c_0%,#ff5f2f_100%)] px-5 py-3 text-sm font-bold text-white shadow-[0_18px_40px_rgba(255,122,69,0.28)]"
          >
            חזרה להתאמות
          </button>
        </PremiumCard>
      </div>
    );
  }

  return (
    <RoomiCharter
      matchId={match.id}
      user1Name={user1Profile.name}
      user2Name={user2Profile.name}
      onClose={() => navigate(createPageUrl("Matches"))}
    />
  );
}
