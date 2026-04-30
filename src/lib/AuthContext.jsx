import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client';
import mixpanel from 'mixpanel-browser';
import { clearClientUserData, APPLE_IDENTITY_CACHE_KEY, LAST_AUTH_PROVIDER_KEY } from '@/lib/clientSessionCleanup';

const AuthContext = createContext();

const isMixpanelEnabledForHostname = (hostname) => {
  const normalizedHostname = (hostname || '').toLowerCase();
  return (
    !normalizedHostname.includes('localhost') &&
    !normalizedHostname.includes('preview-sandbox') &&
    !normalizedHostname.includes('base44')
  );
};

const safeJsonParse = (value, fallbackValue) => {
  try {
    return JSON.parse(value);
  } catch (_) {
    return fallbackValue;
  }
};

const isAppleAuthUser = (user) => {
  if (!user) return false;
  const provider = String(
    user.auth_provider || user.provider || user.sign_in_provider || user.identity_provider || ''
  ).toLowerCase();
  const email = String(user.email || '').toLowerCase();
  return provider.includes('apple') || email.includes('privaterelay.appleid.com');
};

const persistAppleIdentity = (user) => {
  if (!user?.id || typeof window === 'undefined') return;

  const existingCache = safeJsonParse(localStorage.getItem(APPLE_IDENTITY_CACHE_KEY), {});
  const currentEntry = existingCache[String(user.id)] || {};
  const nextEntry = {
    fullName: user.full_name || user.name || currentEntry.fullName || '',
    email: user.email || currentEntry.email || '',
  };

  existingCache[String(user.id)] = nextEntry;
  localStorage.setItem(APPLE_IDENTITY_CACHE_KEY, JSON.stringify(existingCache));
  localStorage.setItem(LAST_AUTH_PROVIDER_KEY, 'apple');
};

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
    try {
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
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);

      // Apple returns name/email only on first authorization.
      // Persist immediately so future logins can rely on user ID lookup + cached profile data.
      if (isAppleAuthUser(currentUser)) {
        persistAppleIdentity(currentUser);
      }

      if (isMixpanelEnabledForHostname(window.location.hostname) && currentUser?.id) {
        mixpanel.identify(String(currentUser.id));
        mixpanel.people.set({
          $name: currentUser.full_name || currentUser.name || '',
          $email: currentUser.email || '',
          user_id: currentUser.id,
        });
      }

      setIsLoadingAuth(false);
    } catch (error) {
      console.error('User auth check failed:', error);
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
    await clearClientUserData();
    
    if (shouldRedirect) {
      // Use the SDK's logout method which handles token cleanup and redirect
      base44.auth.logout(window.location.href);
    } else {
      // Just remove the token without redirect
      base44.auth.logout();
    }
  };

  const navigateToLogin = () => {
    // Use the SDK's redirectToLogin method
    base44.auth.redirectToLogin(window.location.href);
  };

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
