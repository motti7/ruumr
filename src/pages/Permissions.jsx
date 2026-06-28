import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from "@/components/ui/card";
import TinderSwitch from "../components/shared/TinderSwitch";
import { User } from "@/entities/User";
import { Profile } from "@/entities/Profile";
import { syncCurrentProfileToRuumrPlus } from "@/api/ruumrPlus";

/**
 * @param {any} props
 */
const PermissionItem = ({ title, subtitle, checked, onChange }) => (
    <Card className="shadow-sm border-0">
        <CardContent className="p-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-bold text-lg">{title}</h2>
                    <p className="text-gray-600 mt-1 text-sm">{subtitle}</p>
                </div>
                <div className="flex-shrink-0">
                    <TinderSwitch defaultChecked={checked} onChange={onChange} />
                </div>
            </div>
        </CardContent>
    </Card>
);

export default function PermissionsPage() {
    const { t, i18n } = useTranslation();
    const [showInDiscovery, setShowInDiscovery] = useState(true);
    const [showActiveStatus, setShowActiveStatus] = useState(true);
    const [enableNotifications, setEnableNotifications] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const userData = await User.me();
                setUser(userData);
                setShowInDiscovery(userData.show_in_discovery !== false);
                setShowActiveStatus(userData.show_active_status !== false);
                setEnableNotifications(userData.enable_notifications !== false);
            } catch (e) {
                console.error("Failed to load user permissions:", e);
            }
        };
        loadUser();
    }, []);

    const handleDiscoveryChange = async (checked) => {
        setShowInDiscovery(checked);
        try {
            await User.updateMyUserData({ show_in_discovery: checked });
        } catch (e) {
            setShowInDiscovery(!checked);
            return;
        }

        try {
            const profiles = user ? await Profile.filter({ user_id: user.id }) : [];
            if (profiles.length > 0) {
                await Profile.update(profiles[0].id, { is_visible: checked });
                try {
                    await syncCurrentProfileToRuumrPlus();
                } catch (syncError) {
                    console.error("Failed to sync visibility change to Ruumr Plus:", syncError);
                }
            }
        } catch (e) {
            console.error("Failed to update profile visibility", e);
        }
    };

    const handleActiveStatusChange = async (checked) => {
        setShowActiveStatus(checked);
        try {
            await User.updateMyUserData({ show_active_status: checked });
        } catch (e) {
            setShowActiveStatus(!checked);
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen pb-24" dir={i18n.dir()}>
            <div className="flex items-center mb-8">
                <Link to={createPageUrl("Settings")} className="ml-4 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors" aria-label={t("back")}>
                    <ArrowLeft className="w-6 h-6 text-gray-600" />
                </Link>
                <h1 className="text-3xl font-black text-gray-800">{t("manage_permissions")}</h1>
            </div>

            <div className="space-y-4">
                <PermissionItem
                    title={t("show_in_discovery")}
                    subtitle={t("show_in_discovery_sub")}
                    checked={showInDiscovery}
                    onChange={handleDiscoveryChange}
                />
                <PermissionItem
                    title={t("show_active_status")}
                    subtitle={t("show_active_status_sub")}
                    checked={showActiveStatus}
                    onChange={handleActiveStatusChange}
                />
            </div>
        </div>
    );
}
