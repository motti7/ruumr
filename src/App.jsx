import React, { useState, lazy, Suspense, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'

import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import SplashScreen from './components/SplashScreen';
import PageTransition from './components/shared/PageTransition';

// Lazy-load heavy pages for route-based code splitting
const GroupTracker = lazy(() => import('./pages/GroupTracker'));
const GroupCompatibility = lazy(() => import('./pages/GroupCompatibility'));
const GroupChat = lazy(() => import('./pages/GroupChat'));

const PageLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-white">
    <div className="w-8 h-8 border-4 border-gray-200 border-t-[#FF5722] rounded-full animate-spin" />
  </div>
);

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, navigateToLogin } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location?.pathname}>
        <Route path="/" element={
          <PageTransition>
            <LayoutWrapper currentPageName={mainPageKey}>
              <MainPage />
            </LayoutWrapper>
          </PageTransition>
        } />
        {Object.entries(Pages).map(([path, Page]) => (
          <Route
            key={path}
            path={`/${path}`}
            element={
              <PageTransition>
                <LayoutWrapper currentPageName={path}>
                  <Page />
                </LayoutWrapper>
              </PageTransition>
            }
          />
        ))}
        <Route path="/GroupTracker" element={<Suspense fallback={<PageLoader />}><PageTransition><LayoutWrapper currentPageName="GroupTracker"><GroupTracker /></LayoutWrapper></PageTransition></Suspense>} />
        <Route path="/GroupCompatibility" element={<Suspense fallback={<PageLoader />}><PageTransition><LayoutWrapper currentPageName="GroupCompatibility"><GroupCompatibility /></LayoutWrapper></PageTransition></Suspense>} />
        <Route path="/GroupChat" element={<Suspense fallback={<PageLoader />}><PageTransition><LayoutWrapper currentPageName="GroupChat"><GroupChat /></LayoutWrapper></PageTransition></Suspense>} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </AnimatePresence>
  );
};


function App() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <SplashScreen onDone={() => setSplashDone(true)} />
        {splashDone && (
          <Router>
            <NavigationTracker />
            <AuthenticatedApp />
          </Router>
        )}
        <Toaster />

      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App