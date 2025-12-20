import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import LandingPage from "./LandingPage";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      try {
        // Short timeout to prevent hanging
        const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(false), 2000));
        const authPromise = base44.auth.isAuthenticated();
        
        const isLoggedIn = await Promise.race([authPromise, timeoutPromise]);
        
        if (isLoggedIn) {
            navigate(createPageUrl("Discover"));
            return;
        }
      } catch (error) {
        console.warn("Auth check failed or timed out, rendering landing page", error);
      }
      setIsLoading(false);
    };
    checkUser();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[--theme-orange]" />
      </div>
    );
  }

  // Render the Landing Page for unauthenticated users
  return <LandingPage />;
}