import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { MailX, CheckCircle2, AlertTriangle } from "lucide-react";

// Public page (reachable signed out, no app nav). Read the token from the URL
// fragment, hand it to the platform endpoint, and report the outcome. Nothing is
// stored locally: the platform keeps the unsubscribe list.
const COPY = {
  he: {
    title: "הסרה מרשימת התפוצה",
    checking: "מסירים אותך מהרשימה…",
    successTitle: "הוסרת מרשימת התפוצה",
    successBody: "לא נשלח לך יותר מיילים שיווקיים מ־Ruumr.",
    successNote: "מיילים transactional (קבלות, איפוס סיסמה ועדכוני חשבון) ימשיכו להישלח.",
    invalidTitle: "הקישור אינו תקין",
    invalidBody: "הקישור הזה פג תוקף או חסר. אפשר להסיר את עצמך מקישור ההסרה שבתחתית המייל.",
    errorTitle: "משהו לא עבד",
    errorBody: "לא הצלחנו להסיר אותך כרגע. כדאי לנסות שוב.",
    retry: "ניסיון נוסף",
    back: "חזרה לאפליקציה",
  },
  en: {
    title: "Unsubscribe",
    checking: "Removing you from the list…",
    successTitle: "You're unsubscribed",
    successBody: "You won't receive marketing emails from Ruumr anymore.",
    successNote: "Transactional emails (receipts, password resets, account notices) will still arrive.",
    invalidTitle: "This link isn't valid",
    invalidBody: "It may be incomplete or expired. You can unsubscribe from the link at the bottom of any email we sent you.",
    errorTitle: "Something went wrong",
    errorBody: "We couldn't unsubscribe you right now. Please try again.",
    retry: "Try again",
    back: "Back to the app",
  },
};

export default function Unsubscribe() {
  const { i18n } = useTranslation();
  const lang = i18n.language === "he" ? "he" : "en";
  const copy = COPY[lang];
  const [status, setStatus] = useState("loading");
  const startedRef = useRef(false);

  const send = async (token) => {
    setStatus("loading");
    try {
      const response = await fetch("/api/app-emails/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (response.ok) setStatus("success");
      else if (response.status === 400) setStatus("invalid");
      else setStatus("error");
    } catch {
      setStatus("error");
    }
  };

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    const token = new URLSearchParams(window.location.hash.slice(1)).get("token");
    if (!token) {
      setStatus("invalid");
      return;
    }
    send(token);
  }, []);

  const retry = () => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get("token");
    if (!token) {
      setStatus("invalid");
      return;
    }
    send(token);
  };

  const Icon = status === "success" ? CheckCircle2 : status === "invalid" ? AlertTriangle : MailX;

  return (
    <div
      dir={lang === "he" ? "rtl" : "ltr"}
      className="min-h-[100dvh] flex items-center justify-center px-5 py-10 bg-gradient-to-b from-white via-orange-50 to-orange-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800"
    >
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 shadow-xl border border-orange-100 dark:border-slate-800 px-6 py-9 text-center">
        <img src="/ruumr-wordmark.svg" alt="Ruumr" className="h-6 w-auto mx-auto mb-7 dark:invert" />

        <div
          className={`w-14 h-14 rounded-full mx-auto mb-5 flex items-center justify-center ${
            status === "success"
              ? "bg-green-100 dark:bg-green-900/40"
              : status === "invalid"
                ? "bg-amber-100 dark:bg-amber-900/40"
                : "bg-orange-100 dark:bg-orange-900/40"
          }`}
        >
          {status === "loading" ? (
            <div className="w-6 h-6 rounded-full border-[3px] border-orange-200 border-t-[--theme-orange] animate-spin" />
          ) : (
            <Icon
              className={`w-7 h-7 ${
                status === "success"
                  ? "text-green-600"
                  : status === "invalid"
                    ? "text-amber-600"
                    : "text-[--theme-orange]"
              }`}
            />
          )}
        </div>

        <h1
          className="text-xl font-extrabold text-gray-900 dark:text-white mb-2"
          style={{ fontFamily: "'Nunito', 'Rubik', system-ui, sans-serif" }}
        >
          {status === "loading"
            ? copy.checking
            : status === "success"
              ? copy.successTitle
              : status === "invalid"
                ? copy.invalidTitle
                : copy.errorTitle}
        </h1>

        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300" style={{ fontFamily: "'Rubik', system-ui, sans-serif" }}>
          {status === "loading" ? "" : status === "success" ? copy.successBody : status === "invalid" ? copy.invalidBody : copy.errorBody}
        </p>

        {status === "success" && (
          <p className="mt-3 text-xs leading-relaxed text-gray-400 dark:text-gray-500" style={{ fontFamily: "'Rubik', system-ui, sans-serif" }}>
            {copy.successNote}
          </p>
        )}

        {status === "error" && (
          <button
            type="button"
            onClick={retry}
            className="mt-6 w-full min-h-[44px] rounded-full gradient-orange text-white font-bold shadow-lg"
          >
            {copy.retry}
          </button>
        )}

        {(status === "success" || status === "invalid") && (
          <Link
            to="/"
            className="mt-6 inline-flex items-center justify-center min-h-[44px] text-sm font-bold text-[--theme-orange]"
          >
            {copy.back}
          </Link>
        )}
      </div>
    </div>
  );
}