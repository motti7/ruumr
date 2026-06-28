import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function TermsPage() {
    const { t, i18n } = useTranslation();
    const today = new Date().toLocaleDateString(i18n.language === 'he' ? 'he-IL' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="p-6 bg-gray-50 min-h-screen" dir={i18n.dir()}>
            <div className="flex items-center mb-8">
                <Link to={createPageUrl("Settings")} className="ml-4">
                    <ArrowRight className="w-6 h-6 text-gray-600" />
                </Link>
                <h1 className="text-3xl font-black text-gray-800">{t("terms_of_use")}</h1>
            </div>

            <div className="space-y-6 text-gray-700 leading-relaxed">
                <p>{t("terms_intro")}</p>
                <div>
                    <h2 className="font-bold text-lg mb-2">{t("terms_h1")}</h2>
                    <p>{t("terms_p1")}</p>
                </div>
                <div>
                    <h2 className="font-bold text-lg mb-2">{t("terms_h2")}</h2>
                    <p>{t("terms_p2")}</p>
                </div>
                 <div>
                    <h2 className="font-bold text-lg mb-2">{t("terms_h3")}</h2>
                    <p>{t("terms_p3")}</p>
                </div>
                <p className="text-sm text-gray-500">{t("terms_updated", { date: today })}</p>
            </div>
        </div>
    );
}