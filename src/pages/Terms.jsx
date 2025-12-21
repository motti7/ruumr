import React from 'react';
import { ArrowRight, FileText } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-12" dir="rtl">
            <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-sm p-8 md:p-12">
                <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-6">
                    <Link to={createPageUrl('Home')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowRight className="w-6 h-6 text-gray-600" />
                    </Link>
                    <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-[--theme-orange]" />
                        <h1 className="text-3xl font-black text-gray-900">תנאי שימוש</h1>
                    </div>
                </div>

                <div className="prose prose-lg text-gray-600 leading-relaxed">
                    <p className="font-bold text-gray-800">
                        ברוכים הבאים ל-Roomi! השימוש באפליקציה כפוף לתנאים הבאים. אנא קראו אותם בעיון.
                    </p>

                    <h3>1. הסכמה לתנאים</h3>
                    <p>
                        עצם ההרשמה והשימוש ב-Roomi מהווים הסכמה לתנאים אלו. אם אינכם מסכימים, אנא אל תשתמשו בשירות.
                    </p>

                    <h3>2. התנהגות נאותה</h3>
                    <p>
                        Roomi היא קהילה המבוססת על כבוד הדדי. חל איסור מוחלט על:
                    </p>
                    <ul className="list-disc pr-6">
                        <li>הטרדה, אלימות מילולית או שיימינג.</li>
                        <li>העלאת תוכן פוגעני, מיני או גזעני.</li>
                        <li>יצירת פרופילים מזויפים (Catfishing).</li>
                    </ul>
                    <p>
                        אנו שומרים לעצמנו את הזכות לחסום משתמשים שיפרו כללים אלו ללא התראה מוקדמת.
                    </p>

                    <h3>3. אחריות</h3>
                    <p>
                        Roomi משמשת כפלטפורמה לחיבור בין אנשים. אין אנו אחראים על טיב הדירות, אמינות השותפים או כל אינטראקציה שמתרחשת מחוץ לאפליקציה. אנו ממליצים לנקוט במשנה זהירות, להיפגש במקומות ציבוריים ולחתום על חוזים מסודרים.
                    </p>

                    <h3>4. קניין רוחני</h3>
                    <p>
                        כל הזכויות על העיצוב, הקוד והמותג Roomi שמורות לנו. אין להעתיק או לעשות שימוש מסחרי ללא אישור.
                    </p>

                    <p className="text-sm text-gray-400 mt-8">
                        עודכן לאחרונה: ינואר 2025
                    </p>
                </div>
            </div>
        </div>
    );
}