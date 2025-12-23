import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        
        if (isAuth) {
          navigate(createPageUrl('Discover'), { replace: true });
        } else {
          navigate(createPageUrl('Onboarding'), { replace: true });
        }
      } catch (error) {
        // If check fails, redirect to onboarding
        navigate(createPageUrl('Onboarding'), { replace: true });
      } finally {
        setIsChecking(false);
      }
    };

    checkAuthAndRedirect();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="w-12 h-12 animate-spin text-[--theme-orange]" />
    </div>
  );
}