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
        if (!id) throw new Error("match_id_required");
        const user = await User.me();
        const matches = [
          ...(await Match.filter({ user1_id: user.id })),
          ...(await Match.filter({ user2_id: user.id })),
        ];
        if (!matches.some((match) => String(match.id) === String(id))) throw new Error("match_not_found");
        // Check directly via entity — no backend function call that can fail
        const prefs = await base44.entities.QuestionnairePreference.filter({ user_id: user.id });
        const REQUIRED_QUESTIONS = ['q_smoking','q_partners','q_pets','q_cleaning_strictness','q_shopping','q_dishes','q_ac','q_hosting'];
        const completedPref = prefs.find(p => p.answers && REQUIRED_QUESTIONS.every(q => p.answers[q] === 'a' || p.answers[q] === 'b'));
        
        // If questionnaire already complete → skip Charter, go straight to chat
        if (completedPref) {
          navigate(`${createPageUrl("Chat")}?matchId=${encodeURIComponent(id)}`, { replace: true });
          return;
        }
        setMatchId(id);
        setPreference(null);
        setIsEditing(true);
      } catch (error) {
        console.error("Charter page load failed:", error);
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
      {matchId && (
        <>
          <CharterResults
            matchId={matchId}
            refreshKey={refreshKey}
            onEdit={() => setIsEditing(true)}
          />
          {preference && (
            <Button
              type="button"
              onClick={() => navigate(`${createPageUrl("Chat")}?matchId=${encodeURIComponent(matchId)}`)}
              className="mt-4 h-12 w-full rounded-full bg-[--theme-orange] font-bold text-white"
            >
              המשך/י לצ'אט
            </Button>
          )}
        </>
      )}
      {isEditing && (
        <RoomiCharter
          matchId={matchId}
          mode="match"
          initialAnswers={preference?.answers}
          onClose={() => preference ? setIsEditing(false) : navigate(createPageUrl("Matches"))}
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