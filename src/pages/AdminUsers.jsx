import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Profile } from "@/entities/Profile";
import { BannedUser } from "@/entities/BannedUser";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Trash2, ShieldAlert, MessageSquare } from "lucide-react";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [profiles, setProfiles] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);
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
            // Attempt to send email
            await base44.integrations.Core.SendEmail({
                to: userToMsg.email,
                subject: "הודעה מצוות Roomi",
                body: msg
            });
            alert("הודעה נשלחה בהצלחה");
        } catch(e) {
            alert("שגיאה בשליחה");
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
                    <Button onClick={loadData} variant="outline"><Loader2 className={`w-4 h-4 ml-2 ${loading ? 'animate-spin' : ''}`} /> רענן</Button>
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
            </div>
        </div>
    );
}