import React from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-12" dir="rtl">
            <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-sm p-8 md:p-12">
                <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-6">
                    <Link to={createPageUrl('Home')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowRight className="w-6 h-6 text-gray-600" />
                    </Link>
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="w-8 h-8 text-[--theme-orange]" />
                        <h1 className="text-3xl font-black text-gray-900">מדיניות פרטיות</h1>
                    </div>
                </div>

                <div className="prose prose-lg text-gray-600 leading-relaxed">
                    <p className="lead font-bold text-gray-800">
                        ב-Roomi, הפרטיות שלך היא בראש סדר העדיפויות שלנו. המסמך הזה מסביר בצורה פשוטה איזה מידע אנחנו אוספים ואיך אנחנו שומרים עליו.
                    </p>

                    <h3>1. איזה מידע אנחנו אוספים?</h3>
                    <p>
                        כדי לחבר בינך לבין שותפים פוטנציאליים, אנחנו אוספים את הפרטים שאת/ה מזינ/ה בפרופיל: שם, גיל, תמונות, העדפות מגורים, ומידע על אורח החיים שלך ("וייב").
                    </p>

                    <h3>2. שימוש במידע</h3>
                    <p>
                        המידע משמש אך ורק לצורך התאמת שותפים. אנחנו לא מוכרים את המידע שלך לצד שלישי. האלגוריתם שלנו משתמש בנתונים כדי להציג לך אנשים שמתאימים לך ולך להם.
                    </p>

                    <h3>3. אבטחת מידע</h3>
                    <p>
                        אנחנו משתמשים בטכנולוגיות מתקדמות כדי להגן על המידע שלך. סיסמאות מוצפנות, והגישה לנתונים רגישים מוגבלת.
                    </p>

                    <h3>4. מחיקת חשבון</h3>
                    <p>
                        בכל רגע נתון, ניתן למחוק את החשבון ואת כל המידע הקשור אליו דרך עמוד ההגדרות באפליקציה. המחיקה היא מיידית ובלתי הפיכה.
                    </p>

                    <div className="bg-orange-50 p-6 rounded-2xl mt-8">
                        <h4 className="text-[--theme-orange] font-bold mb-2">יש שאלות?</h4>
                        <p className="text-sm mb-0">
                            אנחנו כאן לכל שאלה בנושא פרטיות. מוזמנים לפנות אלינו דרך כפתור "צור קשר" בתחתית העמוד הראשי.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}