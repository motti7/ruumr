import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Trash2, CheckCircle2 } from "lucide-react";
import { createPageUrl } from "@/utils";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";

export default function DataDeletionPage() {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      alert("אנא הסבר/י את הסיבה למחיקה");
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await User.me();
      
      await base44.integrations.Core.SendEmail({
        to: "moti.yeheskel@gmail.com",
        subject: `בקשת מחיקת נתונים מלאה - ${user.email}`,
        body: `
          משתמש ביקש למחוק את כל הנתונים שלו, כולל פרטי כניסה עם גוגל.
          
          פרטי המשתמש:
          - אימייל: ${user.email}
          - שם: ${user.full_name}
          - תאריך הצטרפות: ${new Date(user.created_date).toLocaleDateString('he-IL')}
          
          סיבת המחיקה:
          ${reason}
          
          יש לטפל בבקשה זו בהקדם האפשרי.
        `
      });

      setSubmitted(true);
    } catch (error) {
      console.error(error);
      alert("שגיאה בשליחת הבקשה. נסה שוב.");
    }
    setIsSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-sm p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-4">הבקשה נשלחה בהצלחה</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            בקשתך למחיקת נתונים התקבלה. נטפל בה תוך 30 יום ונעדכן אותך באימייל.
          </p>
          <Link to={createPageUrl("Settings")}>
            <Button className="w-full gradient-orange text-white font-bold">
              חזרה להגדרות
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24" dir="rtl">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-sm p-8">
        <div className="flex items-center gap-2 mb-6">
          <Link to={createPageUrl("Settings")}>
            <ChevronRight className="w-6 h-6 text-gray-400" />
          </Link>
          <h1 className="text-2xl font-black text-gray-900">בקשת מחיקת נתונים מלאה</h1>
        </div>

        <div className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Trash2 className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-red-900 mb-2">מחיקה מלאה וסופית</h3>
                <p className="text-sm text-red-800 leading-relaxed">
                  בקשה זו תמחק את כל הנתונים הקשורים אליך מהמערכת, כולל:
                </p>
                <ul className="text-sm text-red-800 list-disc mr-5 mt-2 space-y-1">
                  <li>פרופיל ותמונות</li>
                  <li>התאמות והודעות</li>
                  <li>העדפות וחיפושים</li>
                  <li>פרטי כניסה עם גוגל</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              אנא הסבר/י את הסיבה למחיקה (חובה)
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="למשל: לא מצאתי שותפים, האפליקציה לא מתאימה לי, בעיות פרטיות..."
              className="min-h-32"
              disabled={isSubmitting}
            />
          </div>

          <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 space-y-2">
            <p className="font-bold text-gray-800">מה קורה אחרי שליחת הבקשה?</p>
            <ul className="list-disc mr-5 space-y-1">
              <li>הבקשה תטופל תוך 30 יום</li>
              <li>תקבל/י אישור למייל כשהמחיקה תושלם</li>
              <li>לא תוכל/י להתחבר לאפליקציה יותר</li>
              <li>המחיקה היא סופית ולא ניתנת לשחזור</li>
            </ul>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !reason.trim()}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-6 rounded-full"
          >
            {isSubmitting ? "שולח בקשה..." : "שלח בקשת מחיקה"}
          </Button>
        </div>
      </div>
    </div>
  );
}