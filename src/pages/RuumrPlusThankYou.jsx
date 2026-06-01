import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Sparkles, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { User } from "@/entities/User";

export default function RuumrPlusThankYouPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("checking"); // checking | active | pending

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 12; // Poll for up to ~60 seconds

    const poll = async () => {
      try {
        const user = await User.me();
        if (user?.is_ruumr_plus) {
          setStatus("active");
          return;
        }
      } catch (_) {}

      attempts++;
      if (attempts >= maxAttempts) {
        setStatus("pending");
        return;
      }
      setTimeout(poll, 5000);
    };

    poll();
  }, []);

  const handleContinue = () => {
    navigate(createPageUrl("RuumrPlus"), { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center" dir="rtl">
      {status === "checking" && (
        <>
          <Loader2 className="w-12 h-12 text-[--theme-orange] animate-spin mb-4" />
          <h1 className="text-2xl font-black text-gray-900">מאמת את התשלום...</h1>
          <p className="mt-2 text-sm text-gray-500">רגע קטן, מאמתים את ההרשמה שלך</p>
        </>
      )}

      {status === "active" && (
        <>
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#FA3803] to-[#ffb45c] mb-4 shadow-lg">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-gray-900">ברוך/ה הבא/ה ל-Plus! 🎉</h1>
          <p className="mt-3 max-w-sm text-sm leading-6 text-gray-600">
            ההרשמה שלך אושרה בהצלחה. עכשיו יש לך גישה לכל תכונות Ruumr Plus.
          </p>
          <Button
            onClick={handleContinue}
            className="mt-6 h-12 w-full max-w-sm rounded-full bg-[--theme-orange] text-white font-bold shadow-lg hover:brightness-110"
          >
            כניסה ל-Ruumr Plus
          </Button>
        </>
      )}

      {status === "pending" && (
        <>
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-50 mb-4">
            <CheckCircle2 className="w-10 h-10 text-[--theme-orange]" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">התשלום התקבל!</h1>
          <p className="mt-3 max-w-sm text-sm leading-6 text-gray-600">
            אישור ההרשמה בדרך — עשוי לקחת כמה רגעים נוספים. ניתן כבר להיכנס לאפליקציה.
          </p>
          <Button
            onClick={handleContinue}
            className="mt-6 h-12 w-full max-w-sm rounded-full bg-[--theme-orange] text-white font-bold shadow-lg hover:brightness-110"
          >
            המשך לאפליקציה
          </Button>
        </>
      )}
    </div>
  );
}