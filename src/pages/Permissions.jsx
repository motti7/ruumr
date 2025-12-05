import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from "@/components/ui/card";
import TinderSwitch from "../components/shared/TinderSwitch";
import { User } from "@/entities/User";

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
    const [showInDiscovery, setShowInDiscovery] = useState(true);
    const [showActiveStatus, setShowActiveStatus] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const loadUser = async () => {
            const userData = await User.me();
            setUser(userData);
            setShowInDiscovery(userData.show_in_discovery !== false);
            setShowActiveStatus(userData.show_active_status !== false);
        };
        loadUser();
    }, []);

    const handleDiscoveryChange = async (checked) => {
        setShowInDiscovery(checked);
        await User.updateMyUserData({ show_in_discovery: checked });
    };

    const handleActiveStatusChange = async (checked) => {
        setShowActiveStatus(checked);
        await User.updateMyUserData({ show_active_status: checked });
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen pb-24" dir="rtl">
            <div className="flex items-center mb-8">
                <Link to={createPageUrl("Settings")} className="ml-4">
                    <ArrowLeft className="w-6 h-6 text-gray-600" />
                </Link>
                <h1 className="text-3xl font-black text-gray-800">ניהול הרשאות</h1>
            </div>

            <div className="space-y-4">
                <PermissionItem 
                    title="הופיע בחיפושים" 
                    subtitle="כבה אפשרות זו כדי להפוך לבלתי נראה באופן זמני." 
                    checked={showInDiscovery} 
                    onChange={handleDiscoveryChange}
                />
                <PermissionItem 
                    title="הצג סטטוס 'פעיל לאחרונה'" 
                    subtitle="שתף מתי היית פעיל/ה לאחרונה באפליקציה." 
                    checked={showActiveStatus} 
                    onChange={handleActiveStatusChange}
                />
            </div>
        </div>
    );
}