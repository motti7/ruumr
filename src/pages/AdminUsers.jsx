import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Profile } from "@/entities/Profile";
import { BannedUser } from "@/entities/BannedUser";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Trash2, ShieldAlert, MessageSquare, Heart, Mail } from "lucide-react";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

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
                await loadData();
            } catch (e) {
                console.error(e);
                navigate(createPageUrl('Home'));
            }
        };
        checkAdminAndLoad();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Fetch users (only admins can list users)
            const allUsers = await User.list();
            // Fetch all profiles to map to users
            const allProfiles = await Profile.list(1000);
            
            const profileMap = {};
            allProfiles.forEach(p => {
                profileMap[p.user_id] = p;
            });

            setUsers(allUsers);
            setProfiles(profileMap);
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

    const sendTestMatchEmail = async () => {
        try {
            const motti = users.find(u => u.email === 'mottishif7@gmail.com');
            if (!motti) {
                alert('משתמש מוטי לא נמצא');
                return;
            }
            
            const mottiProfile = profiles[motti.id];
            if (!mottiProfile) {
                alert('פרופיל של מוטי לא נמצא');
                return;
            }
            
            await base44.integrations.Core.SendEmail({
                to: 'mottishif7@gmail.com',
                subject: '🎉 יש לך התאמה חדשה עם דביר!',
                body: `היי ${mottiProfile.name},<br><br>יש לך התאמה חדשה ב-Roomi עם דביר!<br><br>היכנס/י לאפליקציה כדי להתחיל לצ'וטט:<br><a href="https://roomi.me" style="display:inline-block;background:#FF5722;color:white;padding:12px 24px;text-decoration:none;border-radius:25px;font-weight:bold;margin-top:10px;">פתח את Roomi</a>`
            });
            
            alert('מייל נשלח למוטי!');
        } catch (e) {
            alert('שגיאה בשליחת מייל: ' + e.message);
        }
    };



    const filteredUsers = users.filter(u => 
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profiles[u.id]?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isAdmin) return null;

    return (
        <div className="p-8 bg-gray-50 min-h-screen" dir="rtl">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-black text-gray-900">ניהול משתמשים</h1>
                    <div className="flex gap-2">
                        {selectedUsers.length > 0 && (
                            <Button onClick={() => setShowEmailDialog(true)} className="bg-[--theme-orange] hover:bg-[--theme-orange-dark]">
                                <MessageSquare className="w-4 h-4 ml-2" />
                                שלח הודעה ({selectedUsers.length})
                            </Button>
                        )}
                        <Button onClick={sendTestMatchEmail} variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-50">
                            <Mail className="w-4 h-4 ml-2" />
                            שלח מייל בדיקה למוטי
                        </Button>
                        <Button onClick={() => navigate(createPageUrl('AdminFixMatches'))} variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                            <Heart className="w-4 h-4 ml-2" />
                            תיקון התאמות
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
                                    <TableHead className="text-right">תאריך הרשמה</TableHead>
                                    <TableHead className="text-right">פעולות</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8">
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
                                            <TableCell>{new Date(user.created_date).toLocaleDateString('he-IL')}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => handleMessage(user)} title="שלח הודעה">
                                                        <MessageSquare className="w-4 h-4 text-blue-500" />
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