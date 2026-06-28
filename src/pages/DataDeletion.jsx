import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ChevronRight, Trash2, CheckCircle2 } from "lucide-react";
import { createPageUrl } from "@/utils";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { clearClientUserData } from "@/lib/clientSessionCleanup";

export default function DataDeletionPage() {
  const { t, i18n } = useTranslation();
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      alert(t("explain_deletion_reason"));
      return;
    }

    if (!confirm(t("confirm_permanent_deletion"))) {
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await User.me();
      await base44.functions.invoke("deleteAccount", {});
      
      // Send email to admin to delete the user's login credentials
      await base44.integrations.Core.SendEmail({
        to: "moti.yeheskel@gmail.com",
        subject: `מחיקת פרטי כניסה - ${user.email}`,
        body: `
          משתמש מחק את חשבונו ומבקש למחוק גם את פרטי הכניסה המשויכים לחשבון.
          
          פרטי המשתמש:
          - אימייל: ${user.email}
          - שם: ${user.full_name}
          - תאריך הצטרפות: ${new Date(user.created_date).toLocaleDateString('he-IL')}
          
          סיבת המחיקה:
          ${reason}
          
          יש למחוק את פרטי הכניסה של משתמש זה.
        `
      });

      setSubmitted(true);
      
      // Logout after 3 seconds
      setTimeout(() => {
        clearClientUserData();
        User.logout();
        window.location.href = createPageUrl('Home');
      }, 3000);
      
    } catch (error) {
      console.error(error);
      alert(t("delete_account_error"));
    }
    setIsSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir={i18n.dir()}>
        <div className="max-w-md w-full bg-white rounded-3xl shadow-sm p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-4">{t("account_deleted_heading")}</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            {t("all_data_deleted")}
          </p>
          <Link to={createPageUrl("Settings")}>
            <Button className="w-full gradient-orange text-white font-bold">
              {t("back_to_settings")}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24" dir={i18n.dir()}>
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-sm p-8">
        <div className="flex items-center gap-2 mb-6">
          <Link to={createPageUrl("Settings")}>
            <ChevronRight className="w-6 h-6 text-gray-400" />
          </Link>
          <h1 className="text-2xl font-black text-gray-900">{t("full_data_deletion_request")}</h1>
        </div>

        <div className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Trash2 className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-red-900 mb-2">{t("full_final_deletion")}</h3>
                <p className="text-sm text-red-800 leading-relaxed">
                  {t("request_deletes_all")}
                </p>
                <ul className="text-sm text-red-800 list-disc ms-5 mt-2 space-y-1">
                  <li>{t("dd_item_profile")}</li>
                  <li>{t("dd_item_matches")}</li>
                  <li>{t("dd_item_prefs")}</li>
                  <li>{t("dd_item_login")}</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              {t("explain_reason_required")}
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("deletion_reason_placeholder")}
              className="min-h-32"
              disabled={isSubmitting}
            />
          </div>

          <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 space-y-2">
            <p className="font-bold text-gray-800">{t("what_happens_after")}</p>
            <ul className="list-disc ms-5 space-y-1">
              <li>{t("dd_after_1")}</li>
              <li>{t("dd_after_2")}</li>
              <li>{t("dd_after_3")}</li>
              <li>{t("dd_after_4")}</li>
            </ul>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !reason.trim()}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-6 rounded-full"
          >
            {isSubmitting ? t("sending_request") : t("send_deletion_request")}
          </Button>
        </div>
      </div>
    </div>
  );
}
