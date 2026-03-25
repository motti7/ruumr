import React, { useState } from 'react';
import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import GroupTracker from './pages/GroupTracker';
import GroupCompatibility from './pages/GroupCompatibility';
import GroupChat from './pages/GroupChat';
import SplashScreen from './components/SplashScreen';
import PageTransition from './components/shared/PageTransition';

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
        <Route path="/GroupTracker" element={<PageTransition><LayoutWrapper currentPageName="GroupTracker"><GroupTracker /></LayoutWrapper></PageTransition>} />
        <Route path="/GroupCompatibility" element={<PageTransition><LayoutWrapper currentPageName="GroupCompatibility"><GroupCompatibility /></LayoutWrapper></PageTransition>} />
        <Route path="/GroupChat" element={<PageTransition><LayoutWrapper currentPageName="GroupChat"><GroupChat /></LayoutWrapper></PageTransition>} />
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
        <VisualEditAgent />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App