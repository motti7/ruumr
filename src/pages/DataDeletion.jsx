import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Trash2, CheckCircle2 } from "lucide-react";
import { createPageUrl } from "@/utils";
import { User } from "@/entities/User";
import { Profile, Swipe, Match } from "@/entities/all";
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

    if (!confirm("האם את/ה בטוח/ה שברצונך למחוק את החשבון לצמיתות? פעולה זו בלתי הפיכה.")) {
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await User.me();
      
      // Delete all user data
      const mySwipes = await Swipe.filter({ swiper_id: user.id });
      await Promise.all(mySwipes.map(s => Swipe.delete(s.id)));
      
      const swipesOnMe = await Swipe.filter({ swiped_id: user.id });
      await Promise.all(swipesOnMe.map(s => Swipe.delete(s.id)));
      
      const myMatches1 = await Match.filter({ user1_id: user.id });
      const myMatches2 = await Match.filter({ user2_id: user.id });
      await Promise.all([...myMatches1, ...myMatches2].map(m => Match.delete(m.id)));
      
      const myProfiles = await Profile.filter({ user_id: user.id });
      await Promise.all(myProfiles.map(p => Profile.delete(p.id)));
      
      // Send email to admin to delete Google login credentials
      await base44.integrations.Core.SendEmail({
        to: "moti.yeheskel@gmail.com",
        subject: `מחיקת פרטי כניסה גוגל - ${user.email}`,
        body: `
          משתמש מחק את חשבונו ומבקש למחוק גם את פרטי הכניסה עם גוגל.
          
          פרטי המשתמש:
          - אימייל: ${user.email}
          - שם: ${user.full_name}
          - תאריך הצטרפות: ${new Date(user.created_date).toLocaleDateString('he-IL')}
          
          סיבת המחיקה:
          ${reason}
          
          יש למחוק את פרטי הכניסה עם גוגל של משתמש זה.
        `
      });

      setSubmitted(true);
      
      // Logout after 3 seconds
      setTimeout(() => {
        User.logout();
        window.location.href = createPageUrl('Home');
      }, 3000);
      
    } catch (error) {
      console.error(error);
      alert("שגיאה במחיקת החשבון. נסה שוב.");
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
          <h2 className="text-2xl font-black text-gray-900 mb-4">החשבון נמחק בהצלחה</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            כל הנתונים שלך נמחקו מהמערכת. בקשה למחיקת פרטי הכניסה עם גוגל נשלחה למנהל המערכת.
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
            <p className="font-bold text-gray-800">מה קורה אחרי המחיקה?</p>
            <ul className="list-disc mr-5 space-y-1">
              <li>כל הנתונים שלך יימחקו מיידית</li>
              <li>פרטי הכניסה עם גוגל יימחקו תוך 30 יום</li>
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