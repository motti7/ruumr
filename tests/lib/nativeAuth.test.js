import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockBrowserOpen = vi.fn();
const mockBrowserClose = vi.fn();

vi.mock('@capacitor/browser', () => ({
  Browser: {
    open: (...args) => mockBrowserOpen(...args),
    close: (...args) => mockBrowserClose(...args),
  },
}));

vi.mock('@capacitor/app', () => ({
  App: {
    addListener: vi.fn(),
    getLaunchUrl: vi.fn(),
  },
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => true,
  },
}));

describe('native auth helpers', () => {
  let nativeAuth;

  beforeEach(async () => {
    vi.resetModules();
    window.sessionStorage.clear();
    mockBrowserOpen.mockClear();
    mockBrowserClose.mockClear();
    nativeAuth = await import('@/lib/nativeAuth');
  });

  it('opens app-specific Google OAuth with a native callback URL', async () => {
    await nativeAuth.openNativeProviderLogin('google');

    expect(mockBrowserOpen).toHaveBeenCalledTimes(1);
    const [{ url }] = mockBrowserOpen.mock.calls[0];
    const loginUrl = new URL(url);

    expect(loginUrl.origin).toBe('https://app.ruumrapp.com');
    expect(loginUrl.pathname).toBe('/api/apps/auth/login');
    expect(loginUrl.searchParams.get('app_id')).toBe('68c919adff6ac6fafb51bed6');
    expect(loginUrl.searchParams.get('from_url')).toBe(nativeAuth.NATIVE_AUTH_CALLBACK_URL);
  });

  it('opens app-specific Apple OAuth with a native callback URL', async () => {
    await nativeAuth.openNativeProviderLogin('apple');

    const [{ url }] = mockBrowserOpen.mock.calls[0];
    const loginUrl = new URL(url);

    expect(loginUrl.pathname).toBe('/api/apps/auth/apple/login');
    expect(loginUrl.searchParams.get('from_url')).toBe(nativeAuth.NATIVE_AUTH_CALLBACK_URL);
  });

  it('handles native callback tokens and persists auth hints', async () => {
    const onToken = vi.fn();

    const handled = await nativeAuth.handleNativeAuthCallbackUrl(
      'com.ruumr.app.android://auth/callback?access_token=abc123&provider=apple&name=Jane%20Appleseed&is_new_user=true',
      { onToken }
    );

    expect(handled).toBe(true);
    expect(mockBrowserClose).toHaveBeenCalledTimes(1);
    expect(onToken).toHaveBeenCalledWith('abc123');
    expect(JSON.parse(window.sessionStorage.getItem('ruumr_auth_callback_hints'))).toEqual({
      provider: 'apple',
      name: 'Jane Appleseed',
      is_new_user: 'true',
    });
  });

  it('ignores unrelated appUrlOpen URLs', async () => {
    const onToken = vi.fn();

    const handled = await nativeAuth.handleNativeAuthCallbackUrl('https://app.ruumrapp.com/', { onToken });

    expect(handled).toBe(false);
    expect(onToken).not.toHaveBeenCalled();
    expect(mockBrowserClose).not.toHaveBeenCalled();
  });
});
