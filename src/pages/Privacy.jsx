import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24" dir="rtl">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-sm p-8">
        <div className="flex items-center gap-2 mb-6">
          <Link to={createPageUrl("Home")}>
            <ChevronRight className="w-6 h-6 text-gray-400" />
          </Link>
          <h1 className="text-2xl font-black text-gray-900">מדיניות פרטיות</h1>
        </div>

        <div className="prose prose-sm text-gray-600 space-y-4">
          <p className="font-bold">עודכן לאחרונה: 20/12/2025</p>
          
          <p>
            ב-Roomi, הפרטיות שלך חשובה לנו. מדיניות זו מסבירה כיצד אנו אוספים, משתמשים ומגינים על המידע האישי שלך.
          </p>

          <h3 className="text-lg font-bold text-gray-800 mt-6">1. איסוף מידע</h3>
          <p>
            אנו אוספים מידע שאתה מספק לנו ישירות, כגון שמך, כתובת הדוא"ל שלך, מספר הטלפון, תמונות והעדפות המגורים שלך בעת יצירת פרופיל.
          </p>

          <h3 className="text-lg font-bold text-gray-800 mt-6">2. שימוש במידע</h3>
          <p>
            המידע משמש אך ורק לצורך הפעלת השירות, התאמת שותפים פוטנציאליים, ויצירת קשר במקרה הצורך. אנו לא מוכרים את המידע שלך לצדדים שלישיים.
          </p>
          
          <h3 className="text-lg font-bold text-gray-800 mt-6">3. אבטחת מידע</h3>
          <p>
            אנו נוקטים באמצעים סבירים כדי להגן על המידע שלך מפני גישה בלתי מורשית. עם זאת, אין מערכת חסינה לחלוטין.
          </p>

          <h3 className="text-lg font-bold text-gray-800 mt-6">4. מחיקת חשבון</h3>
          <p>
            אתה יכול לבקש למחוק את החשבון שלך ואת כל המידע הקשור אליו בכל עת דרך עמוד ההגדרות באפליקציה.
          </p>

          <h3 className="text-lg font-bold text-gray-800 mt-6">5. יצירת קשר</h3>
          <p>
            לכל שאלה בנושא פרטיות, ניתן ליצור איתנו קשר דרך עמוד "צור קשר" או בוואטסאפ: 054-8523140.
          </p>
        </div>
      </div>
    </div>
  );
}