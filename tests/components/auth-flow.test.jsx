/**
 * Tests for the auth race-condition fixes:
 *
 * 1. ProtectedRoute: shows fallback while isLoadingAuth OR isLoadingPublicSettings is true,
 *    preventing premature unauthenticated renders.
 *
 * 2. Onboarding fetchUser: only calls redirectToLogin on actual 401/403 errors,
 *    not transient network failures (Android WebView infinite-redirect fix).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

// ---------------------------------------------------------------------------
// Shared stubs
// ---------------------------------------------------------------------------

vi.mock('@capacitor/core', () => ({
  Capacitor: { getPlatform: () => 'web', isNativePlatform: () => false },
}));

vi.mock('mixpanel-browser', () => ({
  default: { track: vi.fn(), identify: vi.fn(), people: { set: vi.fn() } },
}));

vi.mock('framer-motion', async () => {
  const React = await import('react');
  return {
    motion: new Proxy({}, {
      get: (_, tag) =>
        React.forwardRef((props, ref) => React.createElement(tag, { ...props, ref })),
    }),
    AnimatePresence: ({ children }) => children,
  };
});

// ---------------------------------------------------------------------------
// ProtectedRoute tests
// ---------------------------------------------------------------------------

const mockUseAuth = vi.fn();

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/components/UserNotRegisteredError', () => ({
  default: () => <div data-testid="user-not-registered" />,
}));

// Outlet renders matched child routes; in unit tests there are none so we stub it.
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Outlet: () => <div data-testid="outlet-content" />,
  };
});

function authState(overrides = {}) {
  return {
    isAuthenticated: false,
    isLoadingAuth: false,
    isLoadingPublicSettings: false,
    authError: null,
    ...overrides,
  };
}

describe('ProtectedRoute — loading guard', () => {
  let ProtectedRoute;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('@/components/ProtectedRoute');
    ProtectedRoute = mod.default;
  });

  const customFallback = <div data-testid="loading-spinner" />;
  const unauthEl = <div data-testid="login-page" />;

  it('shows fallback while isLoadingAuth is true', () => {
    mockUseAuth.mockReturnValue(authState({ isLoadingAuth: true }));
    render(
      <MemoryRouter>
        <ProtectedRoute fallback={customFallback} unauthenticatedElement={unauthEl} />
      </MemoryRouter>
    );
    expect(screen.getByTestId('loading-spinner')).toBeTruthy();
    expect(screen.queryByTestId('login-page')).toBeNull();
    expect(screen.queryByTestId('outlet-content')).toBeNull();
  });

  it('shows fallback while isLoadingPublicSettings is true', () => {
    mockUseAuth.mockReturnValue(authState({ isLoadingPublicSettings: true }));
    render(
      <MemoryRouter>
        <ProtectedRoute fallback={customFallback} unauthenticatedElement={unauthEl} />
      </MemoryRouter>
    );
    expect(screen.getByTestId('loading-spinner')).toBeTruthy();
    expect(screen.queryByTestId('login-page')).toBeNull();
  });

  it('renders unauthenticatedElement once loading is done and user is not authenticated', () => {
    mockUseAuth.mockReturnValue(authState({ isAuthenticated: false }));
    render(
      <MemoryRouter>
        <ProtectedRoute fallback={customFallback} unauthenticatedElement={unauthEl} />
      </MemoryRouter>
    );
    expect(screen.getByTestId('login-page')).toBeTruthy();
    expect(screen.queryByTestId('loading-spinner')).toBeNull();
    expect(screen.queryByTestId('outlet-content')).toBeNull();
  });

  it('renders Outlet when loading is done and user is authenticated', () => {
    mockUseAuth.mockReturnValue(authState({ isAuthenticated: true }));
    render(
      <MemoryRouter>
        <ProtectedRoute fallback={customFallback} unauthenticatedElement={unauthEl} />
      </MemoryRouter>
    );
    expect(screen.getByTestId('outlet-content')).toBeTruthy();
    expect(screen.queryByTestId('login-page')).toBeNull();
  });

  it('renders UserNotRegisteredError when authError.type is user_not_registered', () => {
    mockUseAuth.mockReturnValue(
      authState({ authError: { type: 'user_not_registered', message: 'Not registered' } })
    );
    render(
      <MemoryRouter>
        <ProtectedRoute fallback={customFallback} unauthenticatedElement={unauthEl} />
      </MemoryRouter>
    );
    expect(screen.getByTestId('user-not-registered')).toBeTruthy();
    expect(screen.queryByTestId('login-page')).toBeNull();
  });

  it('renders unauthenticatedElement for non-user_not_registered auth errors', () => {
    mockUseAuth.mockReturnValue(
      authState({ authError: { type: 'auth_required', message: 'Auth required' } })
    );
    render(
      <MemoryRouter>
        <ProtectedRoute fallback={customFallback} unauthenticatedElement={unauthEl} />
      </MemoryRouter>
    );
    expect(screen.getByTestId('login-page')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Onboarding fetchUser error-handling tests (Android WebView fix)
// ---------------------------------------------------------------------------

const mockRedirectToLogin = vi.fn();
const mockUserMe = vi.fn();

vi.mock('@/entities/User', () => ({
  User: { me: (...args) => mockUserMe(...args), updateMyUserData: vi.fn() },
}));

vi.mock('@/entities/Profile', () => ({
  Profile: { filter: vi.fn().mockResolvedValue([]), create: vi.fn() },
}));

vi.mock('@/api/base44Client', () => ({
  base44: {
    auth: {
      redirectToLogin: (...args) => mockRedirectToLogin(...args),
      me: vi.fn(),
    },
    entities: {},
  },
}));

vi.mock('@/api/ruumrPlus', () => ({
  syncCurrentProfileToRuumrPlus: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/integrations/Core', () => ({
  UploadFile: vi.fn().mockResolvedValue({ file_url: '' }),
}));

vi.mock('@/lib/simulatorMode', () => ({
  isRuumrSimulatorMode: () => false,
  isRuumrNativeDemoSession: () => false,
  buildSimulatorApartmentPhotos: () => [],
  buildSimulatorProfilePhotos: () => [],
}));

vi.mock('@/lib/auth-return-url', () => ({
  getSafeAuthReturnUrl: () => 'https://example.com',
}));

vi.mock('@/utils', () => ({
  createPageUrl: (name) => `/${name}`,
}));

vi.mock('@/components/shared/BottomSheetSelect', () => ({
  default: () => <div data-testid="bottom-sheet-select" />,
}));

vi.mock('@/components/shared/CitySelect', () => ({
  default: () => <div data-testid="city-select" />,
}));

vi.mock('@/components/shared/ImageLightbox', () => ({
  default: () => null,
}));

vi.mock('@/components/ui/slider', () => ({
  Slider: () => <div data-testid="slider" />,
}));

vi.mock('@/entities/PageView', () => ({
  PageView: { create: vi.fn().mockResolvedValue(null) },
}));

describe('Onboarding — fetchUser error handling (Android WebView fix)', () => {
  let OnboardingPage;

  beforeEach(async () => {
    vi.resetModules();
    mockRedirectToLogin.mockClear();
    const mod = await import('@/pages/Onboarding');
    OnboardingPage = mod.default;
  });

  it('does NOT redirect to login on a transient non-auth error', async () => {
    const networkError = new Error('Network Error');
    // no .status property — simulates a network blip
    mockUserMe.mockRejectedValue(networkError);

    render(
      <MemoryRouter>
        <OnboardingPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(mockUserMe).toHaveBeenCalled());
    expect(mockRedirectToLogin).not.toHaveBeenCalled();
  });

  it('redirects to login on a 401 auth error', async () => {
    const authError = { status: 401, message: 'Unauthorized' };
    mockUserMe.mockRejectedValue(authError);

    render(
      <MemoryRouter>
        <OnboardingPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(mockRedirectToLogin).toHaveBeenCalledTimes(1));
    expect(mockRedirectToLogin).toHaveBeenCalledWith('https://example.com');
  });

  it('redirects to login on a 403 auth error', async () => {
    const authError = { status: 403, message: 'Forbidden' };
    mockUserMe.mockRejectedValue(authError);

    render(
      <MemoryRouter>
        <OnboardingPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(mockRedirectToLogin).toHaveBeenCalledTimes(1));
    expect(mockRedirectToLogin).toHaveBeenCalledWith('https://example.com');
  });

  it('does NOT redirect to login on a 500 server error', async () => {
    const serverError = { status: 500, message: 'Internal Server Error' };
    mockUserMe.mockRejectedValue(serverError);

    render(
      <MemoryRouter>
        <OnboardingPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(mockUserMe).toHaveBeenCalled());
    expect(mockRedirectToLogin).not.toHaveBeenCalled();
  });
});
