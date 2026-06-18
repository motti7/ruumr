import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client';
import { getSafeAuthReturnUrl } from '@/lib/auth-return-url';
import { identifyMixpanelUser } from '@/lib/mixpanelTracking';
import { Capacitor } from '@capacitor/core';
import { isRuumrNativeDemoSession, isRuumrSimulatorMode } from '@/lib/simulatorMode';
import { enableSimulatorBackend, getSimulatorBackendState } from '@/lib/simulatorBackend';
import { resolveAndSyncAppleIdentity } from '@/lib/appleIdentity';
import { Profile } from '@/entities/Profile';
import { clearAuthCallbackHints, getStoredAuthCallbackHints } from '@/lib/authCallbackHints';
import { LAST_USED_AUTH_METHOD_KEY } from '@/lib/clientSessionCleanup';
import {
  isNativeAuthAvailable,
  openNativeProviderLogin,
  registerNativeAuthCallbackHandler,
} from '@/lib/nativeAuth';
import { isWebAuthSessionAvailable, signInWithWebAuthSession } from '@/lib/webAuthSession';

const AuthContext = createContext(null);

const missingAuthContext = {
  user: null,
  isAuthenticated: false,
  isLoadingAuth: false,
  isLoadingPublicSettings: false,
  authError: null,
  appPublicSettings: null,
  logout: async () => undefined,
  navigateToLogin: () => undefined,
  loginWithProvider: async () => undefined,
  checkAppState: async () => undefined,
  hasProfile: null,
  setHasProfile: () => undefined,
};

const isNativePlatform = typeof window !== 'undefined' && Capacitor.isNativePlatform();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null); // Contains only { id, public_settings }
  // null = unknown/loading, true = has a Ruumr Profile, false = authenticated but no Profile yet.
  // Drives the locked-preview Discover state and the locked bottom-nav tabs.
  const [hasProfile, setHasProfile] = useState(null);

  useEffect(() => {
    checkAppState();
  }, []);

  // Resolve whether the authenticated user has completed a Profile. Kept in
  // AuthContext so both Discover (locked preview) and Layout (locked tabs) read
  // one source of truth. Failure leaves it null (unknown) so we never lock a
  // user who actually has a profile.
  const loadHasProfile = async (userId) => {
    if (!userId) {
      setHasProfile(null);
      return;
    }
    try {
      const profiles = await Profile.filter({ user_id: userId });
      setHasProfile(Array.isArray(profiles) && profiles.length > 0);
    } catch (_) {
      const simulatorState = getSimulatorBackendState();
      const simProfiles = simulatorState?.collections?.Profile?.filter(
        (profile) => String(profile.user_id) === String(userId)
      );
      setHasProfile(simProfiles ? simProfiles.length > 0 : null);
    }
  };

  const checkAppState = async () => {
    console.log('[ruumr] checkAppState: start, hasToken =', Boolean(appParams.token));
    try {
      if (isRuumrSimulatorMode()) {
        enableSimulatorBackend(base44);
        let currentUser = null;

        try {
          currentUser = await base44.auth.me();
        } catch (authError) {
          const simulatorState = getSimulatorBackendState();
          if (simulatorState?.currentUser) {
            currentUser = simulatorState.currentUser;
          } else if (isRuumrNativeDemoSession()) {
            throw authError;
          } else {
            throw authError;
          }
        }

        setAppPublicSettings({
          id: appParams.appId,
          public_settings: {},
        });
        setUser(currentUser);
        setIsAuthenticated(true);
        await loadHasProfile(currentUser?.id);
        setIsLoadingPublicSettings(false);
        setIsLoadingAuth(false);
        return;
      }

      setIsLoadingPublicSettings(true);
      setAuthError(null);
      
      // First, check app public settings (with token if available)
      // This will tell us if auth is required, user not registered, etc.
      const appClient = createAxiosClient({
        baseURL: `${appParams.serverUrl}/api/apps/public`,
        headers: {
          'X-App-Id': appParams.appId
        },
        token: appParams.token, // Include token if available
        interceptResponses: true
      });
      
      try {
        const publicSettings = await appClient.get(`/prod/public-settings/by-id/${appParams.appId}`);
        setAppPublicSettings(publicSettings);
        
        // If we got the app public settings successfully, check if user is authenticated
        if (appParams.token) {
          await checkUserAuth();
        } else {
          setIsLoadingAuth(false);
          setIsAuthenticated(false);
        }
        setIsLoadingPublicSettings(false);
      } catch (appError) {
        console.error('App state check failed:', appError);
        
        // Handle app-level errors
        if (appError.status === 403 && appError.data?.extra_data?.reason) {
          const reason = appError.data.extra_data.reason;
          if (reason === 'auth_required') {
            setAuthError({
              type: 'auth_required',
              message: 'Authentication required'
            });
          } else if (reason === 'user_not_registered') {
            setAuthError({
              type: 'user_not_registered',
              message: 'User not registered for this app'
            });
          } else {
            setAuthError({
              type: reason,
              message: appError.message
            });
          }
        } else {
          setAuthError({
            type: 'unknown',
            message: appError.message || 'Failed to load app'
          });
        }
        setIsLoadingPublicSettings(false);
        setIsLoadingAuth(false);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setAuthError({
        type: 'unknown',
        message: error.message || 'An unexpected error occurred'
      });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const checkUserAuth = async () => {
    try {
      // Now check if the user is authenticated
      setIsLoadingAuth(true);
      console.log('[ruumr] checkUserAuth: calling base44.auth.me()');
      let currentUser = await base44.auth.me();
      console.log('[ruumr] checkUserAuth: success, user id =', currentUser?.id);
      const authHints = getStoredAuthCallbackHints() || appParams.authHints;
      const appleIdentitySnapshot = await resolveAndSyncAppleIdentity({
        authModule: base44.auth,
        user: currentUser,
        authUser: currentUser,
        authHints,
        fallbackName: '',
        onPersistError: (persistError) => {
          console.warn('Failed to cache Apple identity locally:', persistError);
        },
      });

      // Apple returns name/email only on first authorization.
      // Persist immediately so future logins can rely on Base44 + cached profile data.
      if (appleIdentitySnapshot.appleAuthUser) {
        currentUser = appleIdentitySnapshot.user;
      }

      setUser(currentUser);
      setIsAuthenticated(true);
      await loadHasProfile(currentUser?.id);

      if (currentUser?.id) {
        const appleIdentity = appleIdentitySnapshot.appleAuthUser ? appleIdentitySnapshot.appleIdentity : null;
        identifyMixpanelUser(currentUser.id, {
          $name: appleIdentity?.fullName || appleIdentity?.displayName || currentUser.full_name || currentUser.name || '',
          $email: currentUser.email || '',
          user_id: currentUser.id,
        });
      }

      setIsLoadingAuth(false);
    } catch (error) {
      console.error('[ruumr] checkUserAuth failed:', error?.status, error?.message);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);

      // If user auth fails, it might be an expired token
      if (error.status === 401 || error.status === 403) {
        setAuthError({
          type: 'auth_required',
          message: 'Authentication required'
        });
      }
    }
  };

  // Shared token handler for both native return paths: the ASWebAuthenticationSession
  // result (iOS) and the appUrlOpen deep link (Android / fallback).
  const handleNativeAuthToken = async (accessToken) => {
    base44.auth.setToken(accessToken);
    setAuthError(null);
    setIsLoadingPublicSettings(false);
    await checkUserAuth();
  };

  useEffect(() => {
    return registerNativeAuthCallbackHandler({ onToken: handleNativeAuthToken });
  }, []);

  const logout = async (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    setAuthError(null);
    setAppPublicSettings(null);
    clearAuthCallbackHints();

    try {
      window.localStorage?.removeItem(LAST_USED_AUTH_METHOD_KEY);
    } catch (_) {}

    if (shouldRedirect) {
      base44.auth.logout(getSafeAuthReturnUrl());
    } else {
      base44.auth.logout();
    }
  };

  const navigateToLogin = () => {
    if (isNativeAuthAvailable()) {
      return;
    }

    // Use the SDK's redirectToLogin method
    base44.auth.redirectToLogin(getSafeAuthReturnUrl());
  };

  const loginWithProvider = async (provider) => {
    if (isNativeAuthAvailable()) {
      // iOS: ASWebAuthenticationSession returns the callback (with token) directly,
      // prompt-free. Android / iOS without the native plugin: system browser + deep link.
      if (isWebAuthSessionAvailable()) {
        await signInWithWebAuthSession(provider, { onToken: handleNativeAuthToken });
        return;
      }
      await openNativeProviderLogin(provider);
      return;
    }

    base44.auth.loginWithProvider(provider, getSafeAuthReturnUrl());
  };

  useEffect(() => {
    if (!isNativePlatform) {
      return;
    }

    // Native WebViews can occasionally stall during the initial Base44 handshake.
    // If that happens, fail open so the simulator/device can still show the app shell.
    const fallbackTimer = window.setTimeout(() => {
      setIsLoadingPublicSettings((current) => (current ? false : current));
      setIsLoadingAuth((current) => (current ? false : current));
    }, 3000);

    return () => window.clearTimeout(fallbackTimer);
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin,
      loginWithProvider,
      checkAppState,
      hasProfile,
      setHasProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useOptionalAuth = () => useContext(AuthContext) || missingAuthContext;
