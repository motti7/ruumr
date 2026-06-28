import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function HelpCenterPage() {
    const { t, i18n } = useTranslation();
    return (
        <div className="p-6 bg-gray-50 min-h-screen" dir={i18n.dir()}>
            <div className="flex items-center mb-8">
                <Link to={createPageUrl("Settings")} className="ml-4">
                    <ArrowRight className="w-6 h-6 text-gray-600" />
                </Link>
                <h1 className="text-3xl font-black text-gray-800">{t("help_center")}</h1>
            </div>

            <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h2 className="font-bold text-lg">{t("help_q1")}</h2>
                    <p className="text-gray-600 mt-2">{t("help_a1")}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h2 className="font-bold text-lg">{t("help_q2")}</h2>
                    <p className="text-gray-600 mt-2">{t("help_a2")}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h2 className="font-bold text-lg">{t("help_q3")}</h2>
                    <p className="text-gray-600 mt-2">{t("help_a3")}</p>
                </div>
            </div>
        </div>
    );
}