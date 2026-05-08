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

vi.mock('@/lib/simulatorMode', () => ({
  isRuumrSimulatorMode: () => false,
}));

vi.mock('@/lib/ruumrPlusActivation', () => ({
  markRuumrPlusActivationIntent: vi.fn(),
}));

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

let Layout;

beforeEach(async () => {
  vi.resetModules();
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
