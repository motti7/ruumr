import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { PageView } from "@/entities/PageView";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { Loader2, BarChart3, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminAnalyticsPage() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [pageStats, setPageStats] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const checkAdminAndLoad = async () => {
            try {
                const me = await User.me();
                if (me.role !== 'admin') {
                    navigate(createPageUrl('Home'));
                    return;
                }
                setIsAdmin(true);
                await loadStats();
            } catch (e) {
                console.error(e);
                navigate(createPageUrl('Home'));
            }
        };
        checkAdminAndLoad();
    }, []);

    const loadStats = async () => {
        setLoading(true);
        try {
            const allViews = await PageView.list(10000);
            
            // Filter only Onboarding steps
            const onboardingViews = allViews.filter(v => v.page_name.startsWith('Onboarding - Step'));
            
            // Group by page name
            const grouped = {};
            onboardingViews.forEach(view => {
                if (!grouped[view.page_name]) {
                    grouped[view.page_name] = { count: 0, uniqueUsers: new Set() };
                }
                grouped[view.page_name].count++;
                if (view.user_id) {
                    grouped[view.page_name].uniqueUsers.add(view.user_id);
                }
            });

            // Convert to array and sort by step number
            const stats = Object.keys(grouped).map(pageName => {
                const stepMatch = pageName.match(/Step (\d+)/);
                const stepNum = stepMatch ? parseInt(stepMatch[1]) : 0;
                return {
                    page: pageName,
                    stepNumber: stepNum,
                    totalViews: grouped[pageName].count,
                    uniqueUsers: grouped[pageName].uniqueUsers.size
                };
            }).sort((a, b) => a.stepNumber - b.stepNumber);

            setPageStats(stats);
        } catch (e) {
            console.error("Failed to load analytics", e);
        }
        setLoading(false);
    };

    if (!isAdmin) return null;

    return (
        <div className="p-8 bg-gray-50 min-h-screen" dir="rtl">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 mb-1">שלבי הרשמה</h1>
                        <p className="text-gray-500">כמה אנשים הגיעו לכל שלב בתהליך ההרשמה</p>
                    </div>
                    <BarChart3 className="w-10 h-10 text-[--theme-orange]" />
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-[--theme-orange]" />
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {pageStats.map((stat, idx) => {
                            const dropoff = idx > 0 ? ((pageStats[idx-1].uniqueUsers - stat.uniqueUsers) / pageStats[idx-1].uniqueUsers * 100).toFixed(1) : 0;
                            return (
                            <Card key={stat.page} className="hover:shadow-lg transition-shadow">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-right flex items-center justify-between">
                                        <span className="font-bold text-lg">{stat.page}</span>
                                        {idx > 0 && dropoff > 0 && (
                                            <span className="text-sm text-red-500 font-normal">-{dropoff}% מהשלב הקודם</span>
                                        )}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-orange-50 p-4 rounded-xl text-center">
                                            <Eye className="w-5 h-5 text-[--theme-orange] mx-auto mb-2" />
                                            <div className="text-2xl font-black text-gray-900">{stat.totalViews}</div>
                                            <div className="text-xs text-gray-500">צפיות כוללות</div>
                                        </div>
                                        <div className="bg-blue-50 p-4 rounded-xl text-center">
                                            <div className="text-2xl font-black text-gray-900">{stat.uniqueUsers}</div>
                                            <div className="text-xs text-gray-500">משתמשים ייחודיים</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}))}
                        
                        {pageStats.length === 0 && (
                            <div className="text-center py-12 text-gray-400">
                                <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-30" />
                                <p className="text-lg font-medium">אין נתונים עדיין</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}