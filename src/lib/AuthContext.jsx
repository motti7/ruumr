import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client';
import { getSafeAuthReturnUrl } from '@/lib/auth-return-url';
import mixpanel from 'mixpanel-browser';
import { Capacitor } from '@capacitor/core';
import { isRuumrNativeDemoSession, isRuumrSimulatorMode } from '@/lib/simulatorMode';
import { enableSimulatorBackend, getSimulatorBackendState } from '@/lib/simulatorBackend';
import {
  isAppleAuthUser,
  getCachedAppleIdentity,
  persistAppleIdentity,
  resolveAppleDisplayName,
  syncAppleDisplayNameToBase44,
} from '@/lib/appleIdentity';
import { clearAuthCallbackHints } from '@/lib/authCallbackHints';
import { LAST_USED_AUTH_METHOD_KEY } from '@/lib/clientSessionCleanup';

const AuthContext = createContext(null);

const isMixpanelEnabledForHostname = (hostname) => {
  const normalizedHostname = (hostname || '').toLowerCase();
  return (
    !normalizedHostname.includes('localhost') &&
    !normalizedHostname.includes('preview-sandbox') &&
    !normalizedHostname.includes('base44')
  );
};

const isNativePlatform = typeof window !== 'undefined' && Capacitor.isNativePlatform();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null); // Contains only { id, public_settings }

  useEffect(() => {
    checkAppState();
  }, []);

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
      const cachedIdentity = currentUser?.id ? getCachedAppleIdentity(currentUser.id) : null;
      const authHints = appParams.authHints;

      // Apple returns name/email only on first authorization.
      // Persist immediately so future logins can rely on Base44 + cached profile data.
      if (isAppleAuthUser(currentUser, cachedIdentity, authHints)) {
        const appleIdentity = resolveAppleDisplayName({
          authUser: currentUser,
          authHints,
          cachedIdentity,
          fallbackName: '',
        });
        currentUser = await syncAppleDisplayNameToBase44(base44.auth, currentUser, appleIdentity, cachedIdentity, authHints);
        currentUser = {
          ...currentUser,
          full_name: currentUser.full_name || appleIdentity.fullName || '',
        };
        try {
          persistAppleIdentity(currentUser.id, {
            fullName: appleIdentity.fullName || '',
            email: currentUser.email || '',
          });
        } catch (persistError) {
          console.warn('Failed to cache Apple identity locally:', persistError);
        }
      }

      setUser(currentUser);
      setIsAuthenticated(true);

      if (isMixpanelEnabledForHostname(window.location.hostname) && currentUser?.id) {
        const appleIdentity = isAppleAuthUser(currentUser, cachedIdentity, authHints)
          ? resolveAppleDisplayName({ authUser: currentUser, authHints, cachedIdentity, fallbackName: '' })
          : null;
        mixpanel.identify(String(currentUser.id));
        mixpanel.people.set({
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
    // Use the SDK's redirectToLogin method
    base44.auth.redirectToLogin(getSafeAuthReturnUrl());
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
      checkAppState
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
