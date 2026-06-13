import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Match } from "@/entities/all";
import { User } from "@/entities/User";
import { createPageUrl } from "@/utils";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/shared/BackButton";
import RoomiCharter from "@/components/charter/RoomiCharter";
import CharterResults from "@/components/charter/CharterResults";
import { base44 } from "@/api/base44Client";

export default function CharterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [matchId, setMatchId] = useState(null);
  const [preference, setPreference] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const id = new URLSearchParams(location.search).get("matchId");
        if (!id) { navigate(createPageUrl("Matches"), { replace: true }); return; }

        setMatchId(id);

        // Check if user already completed the questionnaire
        const userData = await User.me();
        const REQUIRED_QUESTIONS = ['q_smoking','q_partners','q_pets','q_cleaning_strictness','q_shopping','q_dishes','q_ac','q_hosting'];
        const prefs = await base44.entities.QuestionnairePreference.filter({ user_id: userData.id });
        const hasCompleted = prefs.some(p => p.answers && REQUIRED_QUESTIONS.every(q => p.answers[q] === 'a' || p.answers[q] === 'b'));

        if (hasCompleted) {
          // Already filled questionnaire → show results directly
          const completedPref = prefs.find(p => p.answers && REQUIRED_QUESTIONS.every(q => p.answers[q] === 'a' || p.answers[q] === 'b'));
          setPreference(completedPref);
        }
        // If not completed → the page will show RoomiCharter to fill the questionnaire
      } catch (error) {
        navigate(createPageUrl("Matches"), { replace: true });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [location.search, navigate]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[--theme-orange]" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-28" dir="rtl">
      <div className="mb-5 flex items-center gap-3">
        <BackButton />
        <div>
          <h1 className="text-2xl font-black text-gray-900">שאלון התאמה</h1>
          <p className="text-sm text-gray-500">התשובות נשמרות ומשמשות בכל ההתאמות שלך.</p>
        </div>
      </div>
      {matchId && !preference && (
        <RoomiCharter
          matchId={matchId}
          mode="match"
          onClose={() => navigate(createPageUrl("Matches"))}
          onComplete={(savedPreference) => {
            setPreference(savedPreference);
            setRefreshKey((value) => value + 1);
          }}
        />
      )}
      {matchId && preference && (
        <>
          <CharterResults
            matchId={matchId}
            refreshKey={refreshKey}
            onEdit={() => setIsEditing(true)}
          />
          <Button
            type="button"
            onClick={() => navigate(`${createPageUrl("Chat")}?matchId=${encodeURIComponent(matchId)}`)}
            className="mt-4 h-12 w-full rounded-full bg-[--theme-orange] font-bold text-white"
          >
            המשך/י לצ'אט
          </Button>
        </>
      )}
      {isEditing && preference && (
        <RoomiCharter
          matchId={matchId}
          mode="match"
          initialAnswers={preference?.answers}
          onClose={() => setIsEditing(false)}
          onComplete={(savedPreference) => {
            setPreference(savedPreference);
            setIsEditing(false);
            setRefreshKey((value) => value + 1);
          }}
        />
      )}
    </div>
  );
}