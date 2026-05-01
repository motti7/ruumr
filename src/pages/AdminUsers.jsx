import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Profile } from "@/entities/Profile";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, ShieldAlert, MessageSquare, ClipboardList, Sparkles, RefreshCw } from "lucide-react";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    fetchRuumrPlusEntitlements,
    grantRuumrPlusEntitlement,
    revokeRuumrPlusEntitlement,
    snapshotProfilesToRuumrPlus,
} from "@/api/ruumrPlus";

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [profiles, setProfiles] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [showEmailDialog, setShowEmailDialog] = useState(false);
    const [emailSubject, setEmailSubject] = useState("");
    const [emailBody, setEmailBody] = useState("");
    const [entitlements, setEntitlements] = useState({});
    const [currentAdmin, setCurrentAdmin] = useState(null);
    const [plusActionUserId, setPlusActionUserId] = useState(null);
    const [isSyncingSnapshot, setIsSyncingSnapshot] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const checkAdminAndLoad = async () => {
            try {
                const me = await User.me();
                setCurrentAdmin(me);
                console.log('🔍 Current user:', me);
                console.log('🔍 Is admin?', me.role === 'admin');
                
                if (me.role !== 'admin') {
                    console.log('❌ Not admin, redirecting to Discover');
                    navigate(createPageUrl('Discover'), { replace: true });
                    return;
                }
                
                console.log('✅ Admin confirmed, loading data...');
                setIsAdmin(true);
                await loadData();
            } catch (e) {
                console.error('❌ Error in checkAdminAndLoad:', e);
                navigate(createPageUrl('Discover'), { replace: true });
            }
        };
        checkAdminAndLoad();
    }, [navigate]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Fetch users (only admins can list users)
            const allUsers = await User.list();
            // Fetch all profiles to map to users
            const allProfiles = await Profile.list('-created_date', 1000);
            const entitlementResponse = await fetchRuumrPlusEntitlements().catch((error) => {
                console.error("Failed to load Ruumr Plus entitlements", error);
                return null;
            });
            
            const profileMap = {};
            allProfiles.forEach(p => {
                profileMap[p.user_id] = p;
            });

            const entitlementMap = {};
            (entitlementResponse?.items || entitlementResponse?.result?.items || []).forEach((entitlement) => {
                entitlementMap[entitlement.user_id] = entitlement;
            });

            setUsers(allUsers);
            setProfiles(profileMap);
            setEntitlements(entitlementMap);
        } catch (e) {
            console.error("Failed to load users", e);
            alert("שגיאה בטעינת משתמשים (האם אתה אדמין?)");
        }
        setLoading(false);
    };

    const handleBan = async (userToBan) => {
        if (!confirm(`האם אתה בטוח שברצונך לחסום את ${userToBan.email}?`)) return;
        try {
            await base44.entities.BannedUser.create({
                email: userToBan.email,
                reason: "Admin ban"
            });
            alert("משתמש נחסם בהצלחה");
            // Optional: Delete user session or data if needed
        } catch (e) {
            alert("שגיאה בחסימה: " + e.message);
        }
    };
    
    const handleMessage = async (userToMsg) => {
        const msg = prompt("הכנס הודעה לשליחה למשתמש (SMS/Email):");
        if (!msg) return;
        
        try {
            await base44.integrations.Core.SendEmail({
                to: userToMsg.email,
                subject: "הודעה מצוות Roomi",
                body: msg.replace(/\n/g, '<br>')
            });
            alert("הודעה נשלחה בהצלחה");
        } catch(e) {
            alert("שגיאה בשליחה");
        }
    };

    const handleBulkMessage = async () => {
        if (selectedUsers.length === 0) return;
        if (!emailSubject.trim() || !emailBody.trim()) {
            alert("נא למלא נושא ותוכן המייל");
            return;
        }

        setLoading(true);
        setShowEmailDialog(false);
        let successCount = 0;
        let failCount = 0;

        for (const userId of selectedUsers) {
            const user = users.find(u => u.id === userId);
            if (user && user.email) {
                try {
                     await base44.integrations.Core.SendEmail({
                        to: user.email,
                        subject: emailSubject,
                        body: emailBody.replace(/\n/g, '<br>')
                    });
                    successCount++;
                } catch(e) {
                    failCount++;
                }
            }
        }
        setLoading(false);
        alert(`נשלחו ${successCount} הודעות בהצלחה. ${failCount} נכשלו.`);
        setSelectedUsers([]);
        setEmailSubject("");
        setEmailBody("");
    };

    const handlePlusSnapshotSync = async () => {
        if (!confirm("לסנכרן את כל הפרופילים הקיימים ל-Ruumr Plus?")) return;
        setIsSyncingSnapshot(true);
        try {
            const result = await snapshotProfilesToRuumrPlus({ replace_existing: true });
            const upsertedCount = result?.result?.upserted_count ?? result?.result?.profile_upserts ?? 0;
            alert(`הסנכרון הושלם. עודכנו ${upsertedCount} פרופילים.`);
        } catch (error) {
            console.error("Failed to sync snapshot to Ruumr Plus:", error);
            alert("שגיאה בסנכרון Ruumr Plus");
        } finally {
            setIsSyncingSnapshot(false);
            await loadData();
        }
    };

    const handleTogglePlus = async (userToUpdate) => {
        const existingEntitlement = entitlements[userToUpdate.id];
        const isActive = existingEntitlement?.status === 'active' && String(existingEntitlement?.tier || '').toLowerCase() === 'plus';
        const action = isActive ? 'revoke' : 'grant';

        if (!confirm(`${isActive ? 'לבטל' : 'להעניק'} Plus עבור ${userToUpdate.email}?`)) return;

        setPlusActionUserId(userToUpdate.id);
        try {
            if (isActive) {
                await revokeRuumrPlusEntitlement({
                    userId: userToUpdate.id,
                    grantedBy: currentAdmin?.email || currentAdmin?.full_name || 'admin',
                });
            } else {
                await grantRuumrPlusEntitlement({
                    userId: userToUpdate.id,
                    grantedBy: currentAdmin?.email || currentAdmin?.full_name || 'admin',
                });
            }
            await loadData();
            alert(`${action === 'grant' ? 'Plus הוענק' : 'Plus בוטל'} בהצלחה`);
        } catch (error) {
            console.error("Failed to toggle Ruumr Plus entitlement:", error);
            alert("שגיאה בעדכון Plus");
        } finally {
            setPlusActionUserId(null);
        }
    };

    const toggleSelectUser = (userId) => {
        if (selectedUsers.includes(userId)) {
            setSelectedUsers(selectedUsers.filter(id => id !== userId));
        } else {
            setSelectedUsers([...selectedUsers, userId]);
        }
    };

    const toggleSelectAll = () => {
        if (selectedUsers.length === filteredUsers.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(filteredUsers.map(u => u.id));
        }
    };





    const filteredUsers = users.filter(u => 
        (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (profiles[u.id]?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isAdmin) return null;

    return (
        <div className="p-8 bg-gray-50 min-h-screen" dir="rtl">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-black text-gray-900">ניהול משתמשים <span className="text-lg font-normal text-gray-500">({filteredUsers.length} משתמשים)</span></h1>
                    <div className="flex gap-2">
                        {selectedUsers.length > 0 && (
                            <Button onClick={() => setShowEmailDialog(true)} className="bg-[--theme-orange] hover:bg-[--theme-orange-dark]">
                                <MessageSquare className="w-4 h-4 ml-2" />
                                שלח הודעה ({selectedUsers.length})
                            </Button>
                        )}
                        <Button onClick={() => navigate(createPageUrl('AdminCharter'))} variant="outline" className="border-purple-300 text-purple-600 hover:bg-purple-50">
                            <ClipboardList className="w-4 h-4 ml-2" />
                            שאלון התאמה
                        </Button>
                        <Button onClick={loadData} variant="outline"><Loader2 className={`w-4 h-4 ml-2 ${loading ? 'animate-spin' : ''}`} /> רענן</Button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute top-3 right-3 w-4 h-4 text-gray-400" />
                            <Input 
                                placeholder="חפש לפי שם או אימייל..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pr-10"
                            />
                        </div>
                        <Button
                            onClick={handlePlusSnapshotSync}
                            variant="outline"
                            className="border-orange-300 text-orange-600 hover:bg-orange-50"
                            disabled={isSyncingSnapshot}
                        >
                            <RefreshCw className={`w-4 h-4 ml-2 ${isSyncingSnapshot ? 'animate-spin' : ''}`} />
                            סנכרון Plus
                        </Button>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-right w-[50px]">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0} 
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4"
                                        />
                                    </TableHead>
                                    <TableHead className="text-right">שם</TableHead>
                                    <TableHead className="text-right">אימייל</TableHead>
                                    <TableHead className="text-right">סטטוס פרופיל</TableHead>
                                    <TableHead className="text-right">Ruumr Plus</TableHead>
                                    <TableHead className="text-right">תאריך הרשמה</TableHead>
                                    <TableHead className="text-right">פעולות</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8">
                                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredUsers.map(user => {
                                    const profile = profiles[user.id];
                                    return (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedUsers.includes(user.id)} 
                                                    onChange={() => toggleSelectUser(user.id)}
                                                    className="w-4 h-4"
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-3">
                                                    {profile?.photos?.[0] && (
                                                        <img src={profile.photos[0]} className="w-8 h-8 rounded-full object-cover" />
                                                    )}
                                                    {user.full_name || profile?.name || 'ללא שם'}
                                                </div>
                                            </TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                {profile ? (
                                                    <Badge variant={profile.is_verified ? "success" : "secondary"} className={profile.is_verified ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                                                        {profile.is_verified ? "מאומת" : "לא מאומת"}
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="destructive">אין פרופיל</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {entitlements[user.id]?.status === 'active' && String(entitlements[user.id]?.tier || '').toLowerCase() === 'plus' ? (
                                                    <Badge className="bg-amber-100 text-amber-700 border border-amber-200">
                                                        <Sparkles className="w-3 h-3 ml-1" />
                                                        Plus פעיל
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                                                        ללא Plus
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>{new Date(user.created_date).toLocaleDateString('he-IL')}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => handleMessage(user)} title="שלח הודעה">
                                                        <MessageSquare className="w-4 h-4 text-blue-500" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleTogglePlus(user)}
                                                        title={entitlements[user.id]?.status === 'active' && String(entitlements[user.id]?.tier || '').toLowerCase() === 'plus' ? 'בטל Plus' : 'הענק Plus'}
                                                        disabled={plusActionUserId === user.id}
                                                    >
                                                        {plusActionUserId === user.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                                                        ) : (
                                                            <Sparkles className={`w-4 h-4 ${entitlements[user.id]?.status === 'active' && String(entitlements[user.id]?.tier || '').toLowerCase() === 'plus' ? 'text-amber-500' : 'text-gray-400'}`} />
                                                        )}
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleBan(user)} title="חסום משתמש">
                                                        <ShieldAlert className="w-4 h-4 text-red-500" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
                    <DialogContent className="max-w-2xl" dir="rtl">
                        <DialogHeader>
                            <DialogTitle className="text-right">שליחת מייל ל-{selectedUsers.length} משתמשים</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="subject" className="text-right block">נושא המייל</Label>
                                <Input 
                                    id="subject"
                                    value={emailSubject}
                                    onChange={(e) => setEmailSubject(e.target.value)}
                                    placeholder="לדוגמה: עדכון חשוב מצוות Roomi"
                                    className="text-right"
                                    dir="rtl"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="body" className="text-right block">תוכן המייל</Label>
                                <Textarea 
                                    id="body"
                                    value={emailBody}
                                    onChange={(e) => setEmailBody(e.target.value)}
                                    placeholder="כתוב כאן את תוכן ההודעה...&#10;&#10;ניתן לרדת שורה ולכתוב טקסט ארוך"
                                    className="min-h-[200px] text-right"
                                    dir="rtl"
                                />
                            </div>
                        </div>
                        <DialogFooter className="flex gap-2">
                            <Button variant="outline" onClick={() => setShowEmailDialog(false)}>ביטול</Button>
                            <Button onClick={handleBulkMessage} className="bg-[--theme-orange] hover:bg-[--theme-orange-dark]">
                                שלח מייל
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}