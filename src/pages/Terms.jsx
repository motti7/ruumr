import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function TermsPage() {
    const today = new Date().toLocaleDateString('he-IL', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    return (
        <div className="p-6 bg-gray-50 min-h-screen" dir="rtl">
            <div className="flex items-center mb-8">
                <Link to={createPageUrl("Settings")} className="ml-4">
                    <ArrowRight className="w-6 h-6 text-gray-600" />
                </Link>
                <h1 className="text-3xl font-black text-gray-800">תנאי שימוש</h1>
            </div>

            <div className="space-y-6 text-gray-700 leading-relaxed">
                <p>ברוכים הבאים ל-Roomi. השימוש באפליקציה מהווה הסכמה לתנאים אלו.</p>
                <div>
                    <h2 className="font-bold text-lg mb-2">1. שימוש באפליקציה</h2>
                    <p>האפליקציה מיועדת למציאת שותפים לדיור בלבד. כל שימוש אחר אסור. המשתמשים נדרשים להיות מעל גיל 18.</p>
                </div>
                <div>
                    <h2 className="font-bold text-lg mb-2">2. תוכן משתמש</h2>
                    <p>האחריות על התוכן המועלה (תמונות, טקסטים) חלה על המשתמש בלבד. אין להעלות תוכן פוגעני, מטעה או בלתי חוקי.</p>
                </div>
                 <div>
                    <h2 className="font-bold text-lg mb-2">3. פרטיות</h2>
                    <p>אנו מכבדים את פרטיותך. מידע אישי לא ישותף עם צדדים שלישיים ללא הסכמתך, למעט כנדרש על פי חוק.</p>
                </div>
                <p className="text-sm text-gray-500">תנאי השימוש עודכנו לאחרונה ב{today}.</p>
            </div>
        </div>
    );
}