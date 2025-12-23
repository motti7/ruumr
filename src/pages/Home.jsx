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
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
           navigate(createPageUrl("Discover"));
        } else {
           setIsLoading(false);
        }
      } catch (error) {
        setIsLoading(false);
      }
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