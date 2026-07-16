import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

vi.mock('@/entities/User', () => ({
  User: {
    me: vi.fn().mockResolvedValue({ id: '1', email: 'test@test.com' }),
    updateMyUserData: vi.fn(),
  },
}));

vi.mock('@/entities/Match', () => ({
  Match: { filter: vi.fn().mockResolvedValue([]) },
}));

vi.mock('@/api/base44Client', () => ({
  base44: {
    auth: { updateMe: vi.fn() },
    entities: {
      BannedUser: { filter: vi.fn().mockResolvedValue([]) },
      Profile: { filter: vi.fn().mockResolvedValue([]) },
    },
  },
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => false },
}));

const simulatorState = vi.hoisted(() => ({
  enabled: false,
}));
vi.mock('@/lib/simulatorMode', () => ({
  isRuumrSimulatorMode: () => simulatorState.enabled,
}));

vi.mock('@/lib/ruumrPlusActivation', () => ({
  markRuumrPlusActivationIntent: vi.fn(),
}));

const nativeState = vi.hoisted(() => ({
  isNativeIOSApp: vi.fn(() => false),
}));
vi.mock('@/lib/nativeEnvironment', () => nativeState);

vi.mock('@/hooks/useAndroidBackButton', () => ({ default: vi.fn() }));
vi.mock('@/hooks/useTabHistory', () => ({ default: vi.fn() }));
vi.mock('@/components/reviews/WriteReviewButton', () => ({
  default: () => <button data-testid="review-btn">review</button>,
}));

vi.mock('framer-motion', async () => {
  const React = await import('react');
  return {
    motion: new Proxy({}, {
      get: (_, tag) => React.forwardRef((props, ref) => React.createElement(tag, { ...props, ref })),
    }),
    AnimatePresence: ({ children }) => children,
  };
});

// Controllable auth state so we can exercise the locked-tabs (no Profile) path.
const authState = vi.hoisted(() => ({ hasProfile: null }));
vi.mock('@/lib/AuthContext', () => ({
  useOptionalAuth: () => ({ hasProfile: authState.hasProfile, setHasProfile: () => {} }),
  useAuth: () => ({ hasProfile: authState.hasProfile, setHasProfile: () => {} }),
}));

let Layout;

beforeEach(async () => {
  vi.resetModules();
  window.localStorage.clear();
  simulatorState.enabled = false;
  authState.hasProfile = null;
  nativeState.isNativeIOSApp.mockReturnValue(false);
  const mod = await import('@/Layout');
  Layout = mod.default;
});

function renderLayout(pageName, children = null) {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Layout currentPageName={pageName}>
        {children || <div data-testid="page-content">Page</div>}
      </Layout>
    </MemoryRouter>
  );
}

describe('Single Header Rule', () => {
  it('renders exactly one <header> on Discover page', () => {
    const { container } = renderLayout('Discover');
    const headers = container.querySelectorAll('header');
    expect(headers.length).toBe(1);
  });

  it('renders exactly one <header> when RuumrPlus page is shown', () => {
    const { container } = renderLayout('RuumrPlus');
    const headers = container.querySelectorAll('header');
    expect(headers.length).toBe(1);
  });

  it('renders zero headers on excluded pages', () => {
    for (const page of ['Onboarding', 'Chat', 'ProfileView', 'Charter', 'Verification', 'Banned']) {
      const { container, unmount } = renderLayout(page);
      const headers = container.querySelectorAll('header');
      expect(headers.length).toBe(0);
      unmount();
    }
  });
});

describe('Bottom Nav Rendering', () => {
  it('renders exactly one <nav> on Discover page', () => {
    const { container } = renderLayout('Discover');
    const navs = container.querySelectorAll('nav');
    expect(navs.length).toBe(1);
  });

  it('renders exactly one <nav> on RuumrPlus page', () => {
    const { container } = renderLayout('RuumrPlus');
    const navs = container.querySelectorAll('nav');
    expect(navs.length).toBe(1);
  });

  it('renders zero navs on excluded pages', () => {
    for (const page of ['Onboarding', 'Chat', 'ProfileView']) {
      const { container, unmount } = renderLayout(page);
      const navs = container.querySelectorAll('nav');
      expect(navs.length).toBe(0);
      unmount();
    }
  });

  it('keeps standard nav for simulator demo stage 1 despite stale apartment lifecycle', async () => {
    simulatorState.enabled = true;
    window.localStorage.setItem('ruumr_demo_stage', '1');
    window.localStorage.setItem('ruumr_apartment_lifecycle', 'APARTMENT_FOUND');
    const mod = await import('@/Layout');
    Layout = mod.default;

    const { container } = renderLayout('RuumrPlus');
    const nav = container.querySelector('nav');

    expect(nav).not.toBeNull();
    expect(nav.querySelector('a[href="/RuumrPlus"]')).not.toBeNull();
    expect(nav.querySelector('a[href="/ApartmentServices"]')).toBeNull();
    expect(nav.querySelector('a[href="/TeamChats"]')).toBeNull();
  });

  it('renders apartment-search nav for simulator demo stage 2', async () => {
    simulatorState.enabled = true;
    window.localStorage.setItem('ruumr_demo_stage', '2');
    const mod = await import('@/Layout');
    Layout = mod.default;

    const { container } = renderLayout('Home');
    const nav = container.querySelector('nav');

    expect(nav).not.toBeNull();
    expect(nav.querySelector('a[href="/ApartmentMap"]')).not.toBeNull();
    expect(nav.querySelector('a[href="/RuumrPlus"]')).toBeNull();
    expect(nav.querySelector('a[href="/ApartmentServices"]')).toBeNull();
  });

  it('renders services nav for simulator demo stage 3', async () => {
    simulatorState.enabled = true;
    window.localStorage.setItem('ruumr_demo_stage', '3');
    const mod = await import('@/Layout');
    Layout = mod.default;

    const { container } = renderLayout('ApartmentServices');
    const nav = container.querySelector('nav');

    expect(nav).not.toBeNull();
    expect(nav.querySelector('a[href="/ApartmentServices"]')).not.toBeNull();
    expect(nav.querySelector('a[href="/RuumrPlus"]')).toBeNull();
    expect(nav.querySelector('a[href="/ApartmentMap"]')).toBeNull();
  });
});

describe('Conditional Rendering — Content inside <main>', () => {
  it('renders children inside <main>, not inside <header> or <nav>', () => {
    const { container } = renderLayout('RuumrPlus', <div data-testid="ruumr-plus-content">Plus Content</div>);

    const main = container.querySelector('main');
    expect(main).not.toBeNull();
    expect(main.querySelector('[data-testid="ruumr-plus-content"]')).not.toBeNull();

    const header = container.querySelector('header');
    expect(header.querySelector('[data-testid="ruumr-plus-content"]')).toBeNull();

    const nav = container.querySelector('nav');
    expect(nav.querySelector('[data-testid="ruumr-plus-content"]')).toBeNull();
  });
});

describe('RTL attribute', () => {
  it('root container has dir="rtl"', () => {
    const { container } = renderLayout('Discover');
    const rtlEl = container.querySelector('[dir="rtl"]');
    expect(rtlEl).not.toBeNull();
  });
});

describe('CSS class assertions', () => {
  it('root container uses min-h-[100dvh], not min-h-screen', () => {
    const { container } = renderLayout('Discover');
    const root = container.querySelector('[dir="rtl"]');
    expect(root.className).toContain('min-h-[100dvh]');
    expect(root.className).not.toContain('min-h-screen');
  });

  it('header uses fixed positioning, not sticky', () => {
    const { container } = renderLayout('Discover');
    const header = container.querySelector('header');
    expect(header.className).toContain('fixed');
    expect(header.className).not.toContain('sticky');
  });
});

// Regression guard for the App Store rejection "Settings button not visible on
// iPad". The app chrome (header + bottom nav) must render at every viewport
// width. Previously the chrome lived inside an `sm:hidden` wrapper while a
// chrome-less `hidden sm:flex` block took over at >=640px, so on iPad (where the
// WebView is not detected as a native Capacitor platform) the Settings gear and
// nav disappeared. These assertions fail if that pattern is reintroduced.
describe('Chrome visible at all viewport widths (iPad fix)', () => {
  it('header is not nested under a width-gated (sm:hidden) wrapper', () => {
    const { container } = renderLayout('Discover');
    const header = container.querySelector('header');
    expect(header).not.toBeNull();
    let el = header.parentElement;
    while (el && el !== container) {
      expect(el.className || '').not.toContain('sm:hidden');
      el = el.parentElement;
    }
  });

  it('bottom nav is not nested under a width-gated (sm:hidden) wrapper', () => {
    const { container } = renderLayout('Discover');
    const nav = container.querySelector('nav');
    expect(nav).not.toBeNull();
    let el = nav.parentElement;
    while (el && el !== container) {
      expect(el.className || '').not.toContain('sm:hidden');
      el = el.parentElement;
    }
  });

  it('does not render a chrome-less wide-screen block (hidden sm:flex)', () => {
    const { container } = renderLayout('Discover');
    const wideBlocks = Array.from(container.querySelectorAll('div')).filter(
      (d) => (d.className || '').includes('hidden') && (d.className || '').includes('sm:flex')
    );
    expect(wideBlocks.length).toBe(0);
  });

  it('widens the app shell on tablet instead of keeping a phone-width column', () => {
    const { container } = renderLayout('Discover');
    const headerInner = container.querySelector('header > div');
    const main = container.querySelector('main');
    const navInner = container.querySelector('nav > div');

    expect(headerInner.className).toContain('md:max-w-5xl');
    expect(main.className).toContain('md:max-w-5xl');
    expect(navInner.className).toContain('md:max-w-5xl');
  });
});

// Authenticated users without a Profile get locked bottom-nav tabs, while the
// header Settings entry stays reachable (so account deletion is accessible).
describe('Locked bottom-nav tabs for no-profile users', () => {
  it('dims the nav tabs and shows lock indicators when hasProfile is false', () => {
    authState.hasProfile = false;
    const { container } = renderLayout('Discover');
    const nav = container.querySelector('nav');
    expect(nav).not.toBeNull();
    expect(nav.innerHTML).toContain('opacity-40');
    // lock badges (gray) appear on locked tabs
    expect(nav.querySelectorAll('.bg-gray-400').length).toBeGreaterThan(0);
  });

  it('keeps the header Settings link reachable when tabs are locked', () => {
    authState.hasProfile = false;
    const { container } = renderLayout('Discover');
    expect(container.querySelector('[aria-label="הגדרות"]')).not.toBeNull();
  });

  it('does NOT lock tabs when the user has a Profile', () => {
    authState.hasProfile = true;
    const { container } = renderLayout('Discover');
    const nav = container.querySelector('nav');
    expect(nav.innerHTML).not.toContain('opacity-40');
    expect(nav.querySelectorAll('.bg-gray-400').length).toBe(0);
  });
});

describe('Native iOS Plus tab', () => {
  it('renders the Plus tab in the native iOS app', async () => {
    vi.resetModules();
    nativeState.isNativeIOSApp.mockReturnValue(true);
    Layout = (await import('@/Layout')).default;

    const { container } = renderLayout('Discover');
    const nav = container.querySelector('nav');
    expect(nav).not.toBeNull();
    expect(nav.textContent).toContain('Plus');
  });
});
