import React from 'react';
import { ShieldAlert } from 'lucide-react';

export default function BannedPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center" dir="rtl">
            <ShieldAlert className="w-24 h-24 text-red-500 mb-6" />
            <h1 className="text-3xl font-black text-gray-900 mb-4">החשבון נחסם</h1>
            <p className="text-gray-600 text-lg max-w-md">
                הגישה שלך לאפליקציה נחסמה עקב הפרת תנאי השימוש.
                אם אתה חושב שזו טעות, אנא צור קשר עם התמיכה.
            </p>
        </div>
    );
}