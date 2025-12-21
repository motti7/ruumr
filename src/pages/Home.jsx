import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import LandingPage from "./LandingPage";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Always show Landing Page as the home page
  // Auth logic is handled by the login button in LandingPage
  useEffect(() => {
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return null; 
  }

  // Render the Landing Page for unauthenticated users
  return <LandingPage />;
}