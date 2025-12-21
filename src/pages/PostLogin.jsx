import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { User } from '@/entities/User';
import { Profile } from '@/entities/Profile';
import { Loader2 } from 'lucide-react';

export default function PostLoginPage() {
    const navigate = useNavigate();

    useEffect(() => {
        const checkProfile = async () => {
            try {
                // Wait a bit for auth to settle if needed, though usually redundant
                const user = await User.me();
                if (!user) {
                    // Should not happen if redirected here after login, but safe fallback
                    window.location.href = createPageUrl('Home');
                    return;
                }

                const profiles = await Profile.filter({ user_id: user.id });
                if (profiles && profiles.length > 0) {
                    navigate(createPageUrl('Discover'));
                } else {
                    navigate(createPageUrl('Onboarding'));
                }
            } catch (error) {
                console.error("Login check failed", error);
                navigate(createPageUrl('Home'));
            }
        };

        checkProfile();
    }, [navigate]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white">
            <Loader2 className="w-12 h-12 text-[#FF5722] animate-spin mb-4" />
            <p className="text-gray-500 font-medium">מתחבר...</p>
        </div>
    );
}