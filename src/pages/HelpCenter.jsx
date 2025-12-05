import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function HelpCenterPage() {
    return (
        <div className="p-6 bg-gray-50 min-h-screen" dir="rtl">
            <div className="flex items-center mb-8">
                <Link to={createPageUrl("Settings")} className="ml-4">
                    <ArrowRight className="w-6 h-6 text-gray-600" />
                </Link>
                <h1 className="text-3xl font-black text-gray-800">מרכז עזרה</h1>
            </div>

            <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h2 className="font-bold text-lg">איך עובד תהליך ההתאמה?</h2>
                    <p className="text-gray-600 mt-2">כאשר שני משתמשים עושים "לייק" (החלקה ימינה) אחד על השני, נוצרת התאמה. תוכלו למצוא את כל ההתאמות שלכם בעמוד "התאמות" ולהתחיל לשוחח.</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h2 className="font-bold text-lg">איך אני עורך את הפרופיל שלי?</h2>
                    <p className="text-gray-600 mt-2">ניתן לערוך את פרטי הפרופיל שלך דרך עמוד "פרופיל". לחץ על כפתור "ערוך" ובצע את השינויים הרצויים. שים לב כי לא ניתן לשנות את גילך.</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h2 className="font-bold text-lg">מה עושים במקרה של התנהגות בלתי הולמת?</h2>
                    <p className="text-gray-600 mt-2">אנו לוקחים את בטיחות המשתמשים שלנו ברצינות. אם נתקלת בהתנהגות בלתי הולמת, אנא דווח לנו באופן מיידי דרך כפתור "צור קשר".</p>
                </div>
            </div>
        </div>
    );
}