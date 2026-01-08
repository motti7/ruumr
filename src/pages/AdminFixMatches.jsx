import React, { useState } from "react";
import { User } from "@/entities/User";
import { Swipe, Match, Profile } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

export default function AdminFixMatchesPage() {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const navigate = useNavigate();

    React.useEffect(() => {
        const checkAdmin = async () => {
            try {
                const me = await User.me();
                if (me.role !== 'admin') {
                    navigate(createPageUrl('Home'));
                    return;
                }
                setIsAdmin(true);
            } catch (e) {
                navigate(createPageUrl('Home'));
            }
        };
        checkAdmin();
    }, []);

    const fixMatches = async () => {
        if (!confirm("האם אתה בטוח? זה יעבור על כל הסווייפים ויצור התאמות למפרע.")) return;
        
        setLoading(true);
        setResults(null);

        try {
            // Get ALL swipes without any filter
            console.log("🔍 Fetching all swipes from database...");
            const allSwipes = await base44.asServiceRole.entities.Swipe.list(100000);
            console.log(`✅ Found ${allSwipes.length} total swipes in system`);
            
            // Also check with regular API
            const regularSwipes = await Swipe.list(100000);
            console.log(`📊 Regular API found: ${regularSwipes.length} swipes`);
            
            // Get ALL profiles
            const allProfiles = await Profile.list(10000);
            const profileMap = {};
            allProfiles.forEach(p => {
                profileMap[p.user_id] = p;
            });
            console.log(`✅ Found ${allProfiles.length} profiles`);
            
            let matchesCreated = 0;
            let matchesSkipped = 0;
            const processedPairs = new Set();
            const mutualLikes = [];

            // Build a map of all likes for quick lookup
            const likesMap = {};
            allSwipes.forEach(swipe => {
                if (swipe.action === 'like') {
                    const key = `${swipe.swiper_id}->${swipe.swiped_id}`;
                    likesMap[key] = true;
                }
            });
            
            console.log(`🔍 Processing ${Object.keys(likesMap).length} likes...`);

            // Find mutual likes
            for (const swipe of allSwipes) {
                if (swipe.action !== 'like') continue;

                const user1 = swipe.swiper_id;
                const user2 = swipe.swiped_id;

                // Create unique pair ID (sorted to avoid duplicates)
                const pairId = [user1, user2].sort().join('|');
                if (processedPairs.has(pairId)) continue;
                processedPairs.add(pairId);

                // Check if reverse like exists using the map
                const reverseLikeKey = `${user2}->${user1}`;
                if (likesMap[reverseLikeKey]) {
                    mutualLikes.push({ user1, user2 });
                    console.log(`💕 Found mutual like: ${user1} <-> ${user2}`);
                }
            }

            console.log(`✅ Found ${mutualLikes.length} mutual likes total`);

            // Now create matches for all mutual likes
            for (const { user1, user2 } of mutualLikes) {
                // Check if match already exists - use asServiceRole to see ALL matches
                const existingMatches = await base44.asServiceRole.entities.Match.filter({
                    $or: [
                        { user1_id: user1, user2_id: user2 },
                        { user1_id: user2, user2_id: user1 }
                    ]
                });

                const p1 = profileMap[user1];
                const p2 = profileMap[user2];

                if (existingMatches.length === 0) {
                    // Create the match using asServiceRole
                    await base44.asServiceRole.entities.Match.create({
                        user1_id: user1,
                        user2_id: user2,
                        user1_name: p1?.name || 'Unknown',
                        user2_name: p2?.name || 'Unknown',
                        status: 'active'
                    });

                    matchesCreated++;
                    console.log(`✅ Created match: ${p1?.name || user1} <-> ${p2?.name || user2}`);
                } else {
                    matchesSkipped++;
                    console.log(`⏭️ Match already exists: ${p1?.name || user1} <-> ${p2?.name || user2}`);
                }
            }

            setResults({
                success: true,
                matchesCreated,
                matchesSkipped,
                totalSwipes: allSwipes.length
            });

        } catch (e) {
            console.error("Error fixing matches:", e);
            setResults({
                success: false,
                error: e.message
            });
        }

        setLoading(false);
    };

    if (!isAdmin) return null;

    return (
        <div className="p-8 bg-gray-50 min-h-screen" dir="rtl">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    <h1 className="text-3xl font-black text-gray-900 mb-2">תיקון התאמות</h1>
                    <p className="text-gray-500 mb-6">
                        הסקריפט הזה יעבור על כל הסווייפים הקיימים במערכת ויצור התאמות למפרע עבור כל שני משתמשים שעשו לייק אחד לשני.
                    </p>

                    <Button 
                        onClick={fixMatches} 
                        disabled={loading}
                        className="w-full h-14 text-lg font-bold bg-[--theme-orange] hover:bg-[--theme-orange-dark]"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                                מעבד...
                            </>
                        ) : (
                            'הרץ תיקון התאמות'
                        )}
                    </Button>

                    {results && (
                        <div className={`mt-6 p-6 rounded-xl border-2 ${
                            results.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                        }`}>
                            <div className="flex items-start gap-3">
                                {results.success ? (
                                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                                ) : (
                                    <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                                )}
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg mb-2">
                                        {results.success ? 'התהליך הושלם בהצלחה!' : 'שגיאה בתהליך'}
                                    </h3>
                                    {results.success ? (
                                        <div className="space-y-1 text-gray-700">
                                            <p>✅ התאמות חדשות שנוצרו: <strong>{results.matchesCreated}</strong></p>
                                            <p>⏭️ התאמות שכבר היו קיימות: <strong>{results.matchesSkipped}</strong></p>
                                            <p>📊 סה"כ סווייפים שנבדקו: <strong>{results.totalSwipes}</strong></p>
                                        </div>
                                    ) : (
                                        <p className="text-red-700">{results.error}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <Button 
                    onClick={() => navigate(createPageUrl('Settings'))}
                    variant="outline"
                    className="mt-4"
                >
                    חזור להגדרות
                </Button>
            </div>
        </div>
    );
}