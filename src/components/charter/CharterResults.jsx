import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Clock, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchQuestionnaireMatchSummary } from "@/api/questionnairePreferences";
import { CHARTER_QUESTIONS } from "@/lib/charterCompletion";

export default function CharterResults({ matchId, onEdit, refreshKey = 0, compact = false }) {
  const { t } = useTranslation();
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSummary = useCallback(async () => {
    setIsLoading(true);
    try {
      setSummary(await fetchQuestionnaireMatchSummary(matchId));
    } catch (error) {
      console.error("Questionnaire match summary failed:", error);
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary, refreshKey]);

  if (isLoading) {
    return <div className="flex justify-center p-6"><Loader2 className="h-6 w-6 animate-spin text-[--theme-orange]" /></div>;
  }

  if (!summary?.current_user_complete) {
    return (
      <div className="rounded-3xl border border-orange-100 bg-orange-50 p-5 text-center">
        <h3 className="font-black text-gray-900">{t("fill_questionnaire_once")}</h3>
        <p className="mt-2 text-sm text-gray-600">{t("answers_used_for_all")}</p>
        <Button onClick={onEdit} className="mt-4 rounded-full bg-[--theme-orange] text-white">{t("start_questionnaire")}</Button>
      </div>
    );
  }

  if (!summary.other_user_complete || !summary.compatibility) {
    return (
      <div className="rounded-3xl border border-orange-100 bg-white p-5 text-center shadow-sm">
        <Clock className="mx-auto h-9 w-9 text-[--theme-orange]" />
        <h3 className="mt-2 font-black text-gray-900">{t("waiting_for_match_answers")}</h3>
        <p className="mt-2 text-sm text-gray-500">{t("your_answers_saved")}</p>
        <Button onClick={onEdit} variant="outline" className="mt-4 rounded-full">
          <Pencil className="ml-2 h-4 w-4" />
          {t("edit_my_answers")}
        </Button>
      </div>
    );
  }

  const compatibility = summary.compatibility;
  const agreements = CHARTER_QUESTIONS.filter((question) => compatibility.agreements.includes(question.id));
  const disagreements = CHARTER_QUESTIONS.filter((question) => compatibility.disagreements.includes(question.id));

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center justify-between bg-gradient-to-l from-[#FA3803] to-[#ff8a45] px-5 py-4 text-white">
        <div>
          <p className="text-xs font-bold text-white/75">{t("questionnaire_match")}</p>
          <p className="text-xl font-black">{t("match_percent", { percent: compatibility.score })}</p>
        </div>
        <Button onClick={onEdit} variant="outline" className="rounded-full border-white/30 bg-white/10 text-white hover:bg-white/20">
          <Pencil className="ml-2 h-4 w-4" />
          {t("edit_action")}
        </Button>
      </div>
      {!compact && (
        <div className="space-y-4 p-4">
          {agreements.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-black text-emerald-700">{t("agreements")}</p>
              <div className="flex flex-wrap gap-2">
                {agreements.map((question) => <span key={question.id} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{question.emoji} {t(question.titleKey)}</span>)}
              </div>
            </div>
          )}
          {disagreements.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-black text-orange-700">{t("topics_to_discuss")}</p>
              <div className="space-y-2">
                {disagreements.map((question) => (
                  <div key={question.id} className="rounded-2xl bg-orange-50 p-3">
                    <p className="text-sm font-bold text-gray-800">{question.emoji} {t(question.titleKey)}</p>
                    <p className="mt-1 text-xs text-orange-700">{t(question.compromiseKey)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
