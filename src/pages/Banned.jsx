import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldAlert } from 'lucide-react';

export default function BannedPage() {
    const { t, i18n } = useTranslation();
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center" dir={i18n.dir()}>
            <ShieldAlert className="w-24 h-24 text-red-500 mb-6" />
            <h1 className="text-3xl font-black text-gray-900 mb-4">{t("account_banned")}</h1>
            <p className="text-gray-600 text-lg max-w-md">
                {t("banned_message")}
            </p>
        </div>
    );
}