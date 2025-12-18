import React, { useState, useEffect } from "react";
import { Profile } from "@/entities/Profile";
import { User } from "@/entities/User";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AdminToolsPage() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [scanResults, setScanResults] = useState([]);
    const [sendingStatus, setSendingStatus] = useState({}); // { userId: 'pending' | 'sent' | 'error' }

    const scanProfiles = async () => {
        setIsLoading(true);
        try {
            // 1. Get all profiles
            const allProfiles = await Profile.list(); // Warning: Fetching all might be heavy in prod
            
            // 2. Filter for bad photos
            const problematicProfiles = allProfiles.filter(p => {
                const hasBadPhoto = (p.photos && p.photos.some(ph => ph && ph.startsWith('blob:'))) ||
                                    (p.apartment_photos && p.apartment_photos.some(ph => ph && ph.startsWith('blob:')));
                return hasBadPhoto;
            });

            // 3. Prepare data (we need emails)
            // Note: This only works if current user is Admin due to RLS on User table
            const results = [];
            for (const p of problematicProfiles) {
                try {
                    // Try to get user email. This might fail if not admin.
                    const users = await base44.entities.User.filter({ id: p.user_id });
                    if (users.length > 0) {
                        results.push({
                            profile: p,
                            email: users[0].email,
                            user: users[0]
                        });
                    }
                } catch (e) {
                    console.error(`Could not fetch user for profile ${p.id}`, e);
                }
            }
            setScanResults(results);
        } catch (e) {
            console.error("Scan failed", e);
            alert("שגיאה בסריקה. וודא שיש לך הרשאות ניהול (Admin).");
        }
        setIsLoading(false);
    };

    const sendFixEmail = async (item) => {
        setSendingStatus(prev => ({ ...prev, [item.profile.user_id]: 'sending' }));
        try {
            await base44.integrations.Core.SendEmail({
                to: item.email,
                subject: "Roomi - שים לב: בעיה בתמונות הפרופיל שלך",
                body: `היי ${item.profile.name},

שמנו לב שחלק מהתמונות בפרופיל שלך לא נשמרו כראוי ולא ניתן לראות אותן באפליקציה.
כדי להגדיל את הסיכויים שלך למצוא שותפים, אנו ממליצים להיכנס לפרופיל ולהעלות את התמונות מחדש.

צוות Roomi`
            });
            setSendingStatus(prev => ({ ...prev, [item.profile.user_id]: 'sent' }));
        } catch (e) {
            console.error(e);
            setSendingStatus(prev => ({ ...prev, [item.profile.user_id]: 'error' }));
        }
    };

    const sendToAll = async () => {
        for (const item of scanResults) {
            if (sendingStatus[item.profile.user_id] !== 'sent') {
                await sendFixEmail(item);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                     <Button variant="ghost" onClick={() => navigate(createPageUrl('Settings'))}>
                        <ArrowRight className="w-6 h-6" />
                    </Button>
                    <h1 className="text-3xl font-black text-gray-900">כלי ניהול</h1>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <AlertTriangle className="text-orange-500" />
                        איתור תמונות תקולות
                    </h2>
                    <p className="text-gray-600 mb-6">
                        כלי זה סורק את כל הפרופילים ומאתר תמונות שנשמרו בפורמט שגוי (blob).
                        לאחר הסריקה, תוכל לשלוח מייל לכל המשתמשים בבת אחת.
                    </p>

                    <Button 
                        onClick={scanProfiles} 
                        disabled={isLoading}
                        className="gradient-orange text-white font-bold"
                    >
                        {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
                        סרוק פרופילים עכשיו
                    </Button>
                </div>

                {scanResults.length > 0 && (
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">נמצאו {scanResults.length} משתמשים עם בעיות</h3>
                            <Button onClick={sendToAll} variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-50">
                                שלח מייל לכולם
                            </Button>
                        </div>

                        <div className="space-y-2">
                            {scanResults.map((item) => (
                                <div key={item.profile.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
                                            {/* Show the bad image if possible, or placeholder */}
                                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">Img</div>
                                        </div>
                                        <div>
                                            <div className="font-bold">{item.profile.name}</div>
                                            <div className="text-sm text-gray-500">{item.email}</div>
                                        </div>
                                    </div>
                                    
                                    <Button 
                                        size="sm" 
                                        onClick={() => sendFixEmail(item)}
                                        disabled={sendingStatus[item.profile.user_id] === 'sent' || sendingStatus[item.profile.user_id] === 'sending'}
                                        className={sendingStatus[item.profile.user_id] === 'sent' ? "bg-green-100 text-green-700 hover:bg-green-200" : ""}
                                    >
                                        {sendingStatus[item.profile.user_id] === 'sending' && <Loader2 className="w-4 h-4 animate-spin" />}
                                        {sendingStatus[item.profile.user_id] === 'sent' && <CheckCircle className="w-4 h-4 mr-1" />}
                                        {sendingStatus[item.profile.user_id] === 'error' && "שגיאה"}
                                        {!sendingStatus[item.profile.user_id] && <Mail className="w-4 h-4 mr-1" />}
                                        {sendingStatus[item.profile.user_id] === 'sent' ? "נשלח" : "שלח התראה"}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {!isLoading && scanResults.length === 0 && (
                    <div className="text-center text-gray-500 mt-4">
                        לא נמצאו בעיות (או שטרם בוצעה סריקה)
                    </div>
                )}
            </div>
        </div>
    );
}