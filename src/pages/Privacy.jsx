import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function PrivacyPage() {
  const { t, i18n } = useTranslation();
  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24" dir={i18n.dir()}>
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-sm p-8">
        <div className="flex items-center gap-2 mb-6">
          <Link to={createPageUrl("Home")}>
            <ChevronRight className="w-6 h-6 text-gray-400" />
          </Link>
          <h1 className="text-2xl font-black text-gray-900">{t("privacy_policy")}</h1>
        </div>

        <div className="prose prose-sm text-gray-600 space-y-4">
          <p className="font-bold">{t("privacy_updated")}</p>

          <p>
            {t("privacy_intro")}
          </p>

          <h3 className="text-lg font-bold text-gray-800 mt-6">{t("privacy_h1")}</h3>
          <p>
            {t("privacy_p1")}
          </p>

          <h3 className="text-lg font-bold text-gray-800 mt-6">{t("privacy_h2")}</h3>
          <p>
            {t("privacy_p2")}
          </p>

          <h3 className="text-lg font-bold text-gray-800 mt-6">{t("privacy_h3")}</h3>
          <p>
            {t("privacy_p3")}
          </p>

          <h3 className="text-lg font-bold text-gray-800 mt-6">{t("privacy_h4")}</h3>
          <p>
            {t("privacy_p4")}
          </p>

          <h3 className="text-lg font-bold text-gray-800 mt-6">{t("privacy_h5")}</h3>
          <p>
            {t("privacy_p5")}
          </p>
        </div>
      </div>
    </div>
  );
}