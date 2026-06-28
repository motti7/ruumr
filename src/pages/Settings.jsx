import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { User } from "@/entities/User";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Bell, Shield, HelpCircle, Lock, Trash2, Heart, LogOut } from "lucide-react";
import { base44 } from "@/api/base44Client";
import TinderSwitch from "../components/shared/TinderSwitch";
import DeleteAccountModal from "../components/settings/DeleteAccountModal";
import { useAuth } from "@/lib/AuthContext";

/**
 * @param {any} props
 */
const SettingsItem = ({ icon, title, action, isLink, to, href, target, rel, onClick }) => {
  const content = (
    <div className="flex items-center justify-between w-full py-4">
      <div className="flex items-center gap-4">
        {icon}
        <p className="font-semibold text-gray-800 text-md">{title}</p>
      </div>
      {action}
    </div>
  );

  if (href) {
    return <a href={href} target={target} rel={rel} className="block">{content}</a>
  }
  if (isLink) {
    return <Link to={to} className="block">{content}</Link>;
  }
  return <div onClick={onClick} className="block cursor-pointer">{content}</div>;
};


export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { logout } = useAuth();
  const [notifyLikes, setNotifyLikes] = useState(true);
  const [notifyMatches, setNotifyMatches] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const userData = await User.me();
        setNotifyLikes(userData.notify_likes !== false);
        setNotifyMatches(userData.notify_matches !== false);
      } catch (e) {
        console.error("Failed to load user settings:", e);
      }
    };
    load();
  }, []);

  const handleNotifyLikesChange = async (val) => {
    setNotifyLikes(val);
    try {
      await base44.auth.updateMe({ notify_likes: val });
    } catch (e) {
      setNotifyLikes(!val);
    }
  };

  const handleNotifyMatchesChange = async (val) => {
    setNotifyMatches(val);
    try {
      await base44.auth.updateMe({ notify_matches: val });
    } catch (e) {
      setNotifyMatches(!val);
    }
  };

  const handleLogout = async () => {
    await logout(true);
  };



  return (
    <div className="p-4 pb-24 bg-gray-50 min-h-screen" dir={i18n.dir()}>
      <DeleteAccountModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} />

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">{t("settings")}</h1>
      </div>

      <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200">
              <p className="font-bold text-lg mb-2 text-gray-800">{t("notifications")}</p>
              <div className="divide-y divide-gray-100">
                <SettingsItem
                  icon={<Heart className="w-5 h-5 text-[--theme-orange]"/>}
                  title={t("new_likes_setting")}
                  action={<TinderSwitch defaultChecked={notifyLikes} onChange={handleNotifyLikesChange} />}
                />
                <SettingsItem
                  icon={<Bell className="w-5 h-5 text-[--theme-orange]"/>}
                  title={t("matches_messages_setting")}
                  action={<TinderSwitch defaultChecked={notifyMatches} onChange={handleNotifyMatchesChange} />}
                />
              </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200">
              <p className="font-bold text-lg mb-2 text-gray-800">{t("account")}</p>
              <div className="divide-y divide-gray-100">
                <SettingsItem icon={<Lock className="w-5 h-5 text-gray-500"/>} title={t("manage_permissions")} action={<ChevronLeft className="text-gray-400"/>} isLink to={createPageUrl("Permissions")} />
              </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200">
              <p className="font-bold text-lg mb-2 text-gray-800">{t("support")}</p>
               <div className="divide-y divide-gray-100">
                <SettingsItem icon={<HelpCircle className="w-5 h-5 text-gray-500"/>} title={t("help_center")} action={<ChevronLeft className="text-gray-400"/>} isLink to={createPageUrl("HelpCenter")} />
                <SettingsItem icon={<Shield className="w-5 h-5 text-gray-500"/>} title={t("terms_of_use")} action={<ChevronLeft className="text-gray-400"/>} isLink to={createPageUrl("Terms")} />
                <SettingsItem icon={<img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" className="w-6 h-6"/>} title={t("contact_us")} action={<ChevronLeft className="text-gray-400"/>} href="https://wa.me/972548523140" target="_blank" rel="noopener noreferrer" />
              </div>
          </div>

        <div className="pt-6 space-y-4">
             <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full text-center text-gray-600 font-bold text-lg min-h-[44px]"
              aria-label={t("logout")}
            >
              <LogOut className="w-5 h-5 ml-2" />
              {t("logout")}
            </Button>

            <Button
               onClick={() => setShowDeleteModal(true)}
               variant="ghost"
               className="w-full text-center text-red-500 font-bold text-lg min-h-[44px]"
               aria-label={t("open_delete_account_dialog")}
             >
                <Trash2 className="w-5 h-5 ml-2" />
                {t("delete_account")}
            </Button>
            


        </div>
      </div>
    </div>
  );
}