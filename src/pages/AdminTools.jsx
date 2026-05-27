import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Shield, Search, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function AdminTools() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    const init = async () => {
      const me = await base44.auth.me();
      if (me.role !== 'admin') {
        navigate('/');
        return;
      }
      setCurrentUser(me);

      const [profileList, userList] = await Promise.all([
        base44.entities.Profile.list('-created_date', 500),
        base44.entities.User.list('-created_date', 500),
      ]);
      setProfiles(profileList);
      setUsers(userList);
      setLoading(false);
    };
    init();
  }, []);

  const togglePlusAccess = async (profile) => {
    const newValue = !profile.is_ruumr_plus;
    setUpdating(profile.id);
    await base44.entities.Profile.update(profile.id, { is_ruumr_plus: newValue });
    setProfiles((prev) =>
      prev.map((p) => p.id === profile.id ? { ...p, is_ruumr_plus: newValue } : p)
    );
    setUpdating(null);
  };

  const getUserEmail = (userId) => {
    const user = users.find((u) => u.id === userId);
    return user?.email || '';
  };

  const filtered = profiles.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      getUserEmail(p.user_id)?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[--theme-orange]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 max-w-2xl mx-auto" dir="rtl">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-6 h-6 text-[--theme-orange]" />
        <h1 className="text-2xl font-bold">Admin Tools</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border p-4 mb-4">
        <h2 className="text-lg font-semibold mb-3">ניהול גישה ל-Ruumr Plus</h2>
        <div className="relative mb-4">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חפש לפי שם או אימייל..."
            className="pr-9"
          />
        </div>

        <div className="space-y-2">
          {filtered.map((profile) => {
            const email = getUserEmail(profile.user_id);
            const hasPlus = !!profile.is_ruumr_plus;
            const isUpdating = updating === profile.id;
            return (
              <div
                key={profile.id}
                className="flex items-center justify-between p-3 rounded-xl border bg-gray-50"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{profile.name}</div>
                  <div className="text-xs text-gray-400 truncate">{email}</div>
                </div>
                <div className="flex items-center gap-2 mr-3">
                  {hasPlus ? (
                    <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">Plus ✓</span>
                  ) : (
                    <span className="text-xs text-gray-400">רגיל</span>
                  )}
                  <Button
                    size="sm"
                    variant={hasPlus ? 'outline' : 'default'}
                    className={hasPlus ? 'border-red-300 text-red-600 hover:bg-red-50' : 'bg-[--theme-orange] hover:brightness-110 text-white'}
                    onClick={() => togglePlusAccess(profile)}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : hasPlus ? (
                      <><XCircle className="w-3 h-3 mr-1" />הסר Plus</>
                    ) : (
                      <><CheckCircle className="w-3 h-3 mr-1" />הענק Plus</>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-center text-gray-400 py-6 text-sm">לא נמצאו תוצאות</p>
          )}
        </div>
      </div>
    </div>
  );
}