import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

const mockSetToken = vi.fn();
vi.mock('@/api/base44Client', () => ({
  base44: { auth: { setToken: (...args) => mockSetToken(...args) } },
}));

import AuthCallback from '@/pages/AuthCallback';

const setLocation = (search) => {
  const replace = vi.fn();
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { search, replace, href: `https://app.ruumrapp.com/auth/callback${search}` },
  });
  return replace;
};

const setUserAgent = (ua) => {
  Object.defineProperty(window.navigator, 'userAgent', { configurable: true, value: ua });
};

describe('AuthCallback bridge', () => {
  beforeEach(() => {
    mockSetToken.mockClear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('bridges the token to the iOS custom scheme when on an iPad/iPhone', () => {
    setUserAgent('Mozilla/5.0 (iPad; CPU OS 26_5 like Mac OS X) AppleWebKit/605.1.15');
    const replace = setLocation('?access_token=abc123&provider=apple');

    render(<AuthCallback />);

    expect(replace).toHaveBeenCalledTimes(1);
    const target = replace.mock.calls[0][0];
    expect(target.startsWith('com.ruumr.app://auth/callback?')).toBe(true);
    expect(target).toContain('access_token=abc123');
    // The web setToken path must NOT run in the system browser.
    expect(mockSetToken).not.toHaveBeenCalled();
  });

  it('completes the session in-page on web (no native user agent)', () => {
    setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/130');
    const replace = setLocation('?access_token=webtoken');

    render(<AuthCallback />);

    expect(mockSetToken).toHaveBeenCalledWith('webtoken');
    expect(replace).toHaveBeenCalledWith('/');
  });

  it('redirects to /login when the callback carries no access_token', () => {
    setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 26_5 like Mac OS X)');
    const replace = setLocation('');

    render(<AuthCallback />);

    expect(replace).toHaveBeenCalledWith('/login');
    expect(mockSetToken).not.toHaveBeenCalled();
  });
});
