import React, { useCallback, useEffect, useState, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { Capacitor } from '@capacitor/core';

import NavigationTracker from '@/lib/NavigationTracker'
import OneSignalSetup from '@/components/shared/OneSignalSetup'
import { detectNativeIOSSimulator, isNativeIOSApp } from '@/lib/nativeEnvironment';
import { base44 } from '@/api/base44Client';
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import AuthCallback from '@/pages/AuthCallback';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import SplashScreen from './components/SplashScreen';
import PageTransition from './components/shared/PageTransition';
import { enableSimulatorBackend } from '@/lib/simulatorBackend';
import { isRuumrNativeDemoSession } from '@/lib/simulatorMode';

// Lazy-load heavy pages for route-based code splitting
const GroupTracker = lazy(() => import('./pages/GroupTracker'));
import RuumrPlusComingSoon from './pages/RuumrPlusComingSoon';
const RuumrPlusThankYou = lazy(() => import('./pages/RuumrPlusThankYou'));
const TranzilaReturn = lazy(() => import('./pages/TranzilaReturn'));
const ManageSubscription = lazy(() => import('./pages/ManageSubscription'));
const AdminTools = lazy(() => import('./pages/AdminTools'));
const GroupCompatibility = lazy(() => import('./pages/GroupCompatibility'));
const GroupChat = lazy(() => import('./pages/GroupChat'));

const PageLoader = () => {
  const { t } = useTranslation();
  return (
  <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-b from-white via-orange-50 to-orange-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 rounded-full border-4 border-orange-100 border-t-[--theme-orange] animate-spin" />
      <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">{t("loading")}</span>
    </div>
  </div>
  );
};

// Tranzila (web checkout) and Wix subscription management are web-only flows.
// Any native app (iOS or Android) must go through RevenueCat instead, so both
// platforms get redirected away from these routes back to the paywall, which
// already knows how to trigger the native RevenueCat purchase.
const NATIVE_PAYMENT_DISABLED_ROUTES = new Set([
  'RuumrPlusCheckout',
  'RuumrPlusThankYou',
  'ManageSubscription',
]);

const NativePaymentUnavailableRedirect = ({ children }) => (
  Capacitor.isNativePlatform() ? <Navigate to="/RuumrPlusPricing" replace /> : children
);

const wrapNativeIOSPaymentGuard = (currentPageName, element) => (
  NATIVE_PAYMENT_DISABLED_ROUTES.has(currentPageName)
    ? <NativePaymentUnavailableRedirect>{element}</NativePaymentUnavailableRedirect>
    : element
);

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : null;
const isNativePlatform = typeof window !== 'undefined' && Capacitor.isNativePlatform();

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const writeBootMarker = (value) => {
  try {
    window.localStorage.setItem('ruumr_boot_marker', value);
  } catch {
    // Best-effort debug trace only.
  }
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, navigateToLogin, user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    writeBootMarker('authenticated-app-mounted');
  }, []);

  useEffect(() => {
    console.log('[ruumr] AuthenticatedApp state', {
      isLoadingAuth,
      isLoadingPublicSettings,
      isAuthenticated,
      authErrorType: authError?.type ?? null,
    });
  }, [authError, isLoadingAuth, isLoadingPublicSettings, isAuthenticated]);

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    writeBootMarker('authenticated-app-loading');
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      writeBootMarker('authenticated-app-user-not-registered');
      return <UserNotRegisteredError />;
    }

    if (authError.type === 'auth_required') {
      writeBootMarker('authenticated-app-auth-required');
      // Both web and native fall through to the shared Login/Register routes;
      // ProtectedRoute redirects unauthenticated users to /login. Native social
      // login goes through the system browser via AuthContext.loginWithProvider.
    }
  }

  // Render the main app
  writeBootMarker('authenticated-app-ready');
  return (
    <>
    <OneSignalSetup userId={user?.id} />
    <AnimatePresence mode="wait">
      <Routes location={location} key={location?.pathname}>
        {/* Public auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* All protected routes */}
        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
          <Route path="/" element={
            <PageTransition>
              <LayoutWrapper currentPageName={mainPageKey}>
                {MainPage ? <MainPage /> : null}
              </LayoutWrapper>
            </PageTransition>
          } />
          {Object.entries(Pages).map(([path, Page]) => (
            <Route
              key={path}
              path={`/${path}`}
              element={wrapNativeIOSPaymentGuard(path,
                <PageTransition>
                  <LayoutWrapper currentPageName={path}>
                    <Page />
                  </LayoutWrapper>
                </PageTransition>
              )}
            />
          ))}
          <Route path="/GroupTracker" element={<Suspense fallback={<PageLoader />}><PageTransition><LayoutWrapper currentPageName="GroupTracker"><GroupTracker /></LayoutWrapper></PageTransition></Suspense>} />
          <Route path="/GroupCompatibility" element={<Suspense fallback={<PageLoader />}><PageTransition><LayoutWrapper currentPageName="GroupCompatibility"><GroupCompatibility /></LayoutWrapper></PageTransition></Suspense>} />
          <Route path="/GroupChat" element={<Suspense fallback={<PageLoader />}><PageTransition><LayoutWrapper currentPageName="GroupChat"><GroupChat /></LayoutWrapper></PageTransition></Suspense>} />
          <Route path="/AdminTools" element={<Suspense fallback={<PageLoader />}><PageTransition><LayoutWrapper currentPageName="AdminTools"><AdminTools /></LayoutWrapper></PageTransition></Suspense>} />
          <Route path="/RuumrPlusComingSoon" element={<PageTransition><LayoutWrapper currentPageName="RuumrPlusComingSoon"><RuumrPlusComingSoon /></LayoutWrapper></PageTransition>} />
          <Route path="/RuumrPlusThankYou" element={wrapNativeIOSPaymentGuard('RuumrPlusThankYou', <Suspense fallback={<PageLoader />}><PageTransition><LayoutWrapper currentPageName="RuumrPlusThankYou"><RuumrPlusThankYou /></LayoutWrapper></PageTransition></Suspense>)} />
          <Route path="/TranzilaReturn" element={<Suspense fallback={<PageLoader />}><TranzilaReturn /></Suspense>} />
          <Route path="/ManageSubscription" element={wrapNativeIOSPaymentGuard('ManageSubscription', <Suspense fallback={<PageLoader />}><PageTransition><LayoutWrapper currentPageName="ManageSubscription"><ManageSubscription /></LayoutWrapper></PageTransition></Suspense>)} />
        </Route>

        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </AnimatePresence>
    </>
  );
};


function App() {
  const { i18n } = useTranslation();
  // Keep the document direction/language in sync with the active language so
  // Hebrew renders RTL and English renders LTR. Runs on mount and whenever the
  // user toggles the language from the header.
  useEffect(() => {
    const applyDirection = (lng) => {
      const dir = lng === 'he' ? 'rtl' : 'ltr';
      document.documentElement.dir = dir;
      document.documentElement.lang = lng;
    };
    applyDirection(i18n.language);
    i18n.on('languageChanged', applyDirection);
    return () => i18n.off('languageChanged', applyDirection);
  }, [i18n]);

  const isNativePlatform = typeof window !== 'undefined' && Capacitor.isNativePlatform();
  const isNativeWebView = isNativePlatform;
  const [splashDone, setSplashDone] = useState(() => isNativeWebView);
  const [nativeBootstrapDone, setNativeBootstrapDone] = useState(() => !isNativeWebView);
  const handleSplashDone = useCallback(() => {
    setSplashDone(true);
  }, []);

  useEffect(() => {
    if (!isNativeWebView) {
      return;
    }

    let cancelled = false;

    const primeNativeBootstrap = async () => {
      const isSimulator = await detectNativeIOSSimulator();
      const shouldUseDemoBackend = isRuumrNativeDemoSession();

      try {
        if (typeof window !== 'undefined') {
          if (shouldUseDemoBackend) {
            writeBootMarker(isSimulator ? 'native-bootstrap-simulator-detected' : 'native-bootstrap-demo-session');
            window.localStorage.setItem('ruumr_simulator_mode', 'true');
            enableSimulatorBackend(base44);
            writeBootMarker('native-bootstrap-backend-enabled');
          } else {
            window.localStorage.removeItem('ruumr_simulator_mode');
            writeBootMarker('native-bootstrap-real-device');
          }
        }
      } catch {
        // Best-effort only. The UI should still proceed even if storage is unavailable.
      } finally {
        if (!cancelled) {
          writeBootMarker('native-bootstrap-complete');
          setNativeBootstrapDone(true);
        }
      }
    };

    void primeNativeBootstrap();

    return () => {
      cancelled = true;
    };
  }, [isNativeWebView]);

  return (
    <>
      {writeBootMarker('app-render')}
      {!isNativePlatform && !splashDone && <SplashScreen onDone={handleSplashDone} />}
      {splashDone && !nativeBootstrapDone && isNativeWebView && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center" style={{ backgroundColor: "#E8420A" }}>
          <div className="flex flex-col items-center gap-2">
            <span
              style={{
                fontFamily: "'Nunito', 'Varela Round', 'Quicksand', sans-serif",
                fontWeight: 800,
                fontSize: "72px",
                color: "white",
                letterSpacing: "-1px",
                lineHeight: 1,
              }}
            >
              ruumr
            </span>
            <span
              style={{
                fontFamily: "'Nunito', 'Varela Round', 'Quicksand', sans-serif",
                fontWeight: 400,
                fontSize: "16px",
                color: "rgba(255,255,255,0.85)",
                letterSpacing: "0.5px",
              }}
            >
              find your perfect roommates
            </span>
          </div>
        </div>
      )}
      {splashDone && nativeBootstrapDone && (
        <AuthProvider>
          <QueryClientProvider client={queryClientInstance}>
            <Router>
              <NavigationTracker />
              <AuthenticatedApp />
            </Router>
          </QueryClientProvider>
        </AuthProvider>
      )}
      <Toaster />
    </>
  )
}

export default App