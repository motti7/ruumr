import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { User } from "@/entities/User";
import { base44 } from "@/api/base44Client";
import { Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

// Maps each question id to its i18n catalog key (reusing the charter title keys
// where the wording matches).
const QUESTIONS = {
  q_smoking: "cq_smoking_title",
  q_partners: "cq_partners_title",
  q_pets: "cq_pets_title",
  q_cleaning_strictness: "admin_q_cleaning",
  q_shopping: "cq_shopping_title",
  q_dishes: "cq_dishes_title",
  q_ac: "cq_ac_title",
  q_hosting: "cq_hosting_title",
};

export default function AdminCharterPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const load = async () => {
      const me = await User.me();
      if (me.role !== "admin") {
        navigate(createPageUrl("Discover"), { replace: true });
        return;
      }

      const [allAnswers, allUsers, allProfiles] = await Promise.all([
        base44.entities.CharterAnswer.list(),
        base44.entities.User.list(),
        base44.entities.Profile.list("-created_date", 1000),
      ]);

      // מפה: user_id → שם
      const nameMap = {};
      allUsers.forEach((u) => {
        nameMap[u.id] = u.full_name || u.email;
      });
      allProfiles.forEach((p) => {
        if (!nameMap[p.user_id] || nameMap[p.user_id] === p.user_id) {
          nameMap[p.user_id] = p.name;
        } else {
          // העדפה לשם מהפרופיל אם קיים
          nameMap[p.user_id] = p.name || nameMap[p.user_id];
        }
      });

      // קיבוץ לפי משתמש
      const byUser = {};
      allAnswers.forEach((a) => {
        if (!byUser[a.user_id]) byUser[a.user_id] = { answers: {} };
        byUser[a.user_id].answers[a.question_id] = a.answer;
      });

      const result = Object.entries(byUser).map(([userId, data]) => ({
        userId,
        name: nameMap[userId] || userId,
        answers: data.answers,
      }));

      setRows(result);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[--theme-orange]" />
      </div>
    );
  }

  const questionIds = Object.keys(QUESTIONS);

  return (
    <div className="p-6 bg-gray-50 min-h-screen" dir={i18n.dir()}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate(createPageUrl("AdminUsers"))}>
            <ArrowRight className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-black text-gray-900">{t("admin_charter_title")}</h1>
          <span className="text-gray-500 text-sm">{t("admin_users_answered", { count: rows.length })}</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-start px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">{t("admin_username")}</th>
                {questionIds.map((qId) => (
                  <th key={qId} className="text-center px-3 py-3 font-semibold text-gray-700 whitespace-nowrap text-xs">
                    {t(QUESTIONS[qId])}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.userId} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{row.name}</td>
                  {questionIds.map((qId) => {
                    const ans = row.answers[qId];
                    return (
                      <td key={qId} className="px-3 py-3 text-center">
                        {ans ? (
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${ans === "a" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>
                            {ans === "a" ? t("answer_a") : t("answer_b")}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}