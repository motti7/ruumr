import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockBrowserOpen = vi.fn();
const mockBrowserClose = vi.fn();

let mockPlatform = 'ios';

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
    getPlatform: () => mockPlatform,
  },
}));

describe('native auth helpers', () => {
  let nativeAuth;

  const loadModule = async () => {
    vi.resetModules();
    nativeAuth = await import('@/lib/nativeAuth');
  };

  beforeEach(async () => {
    mockPlatform = 'ios';
    window.sessionStorage.clear();
    mockBrowserOpen.mockClear();
    mockBrowserClose.mockClear();
    await loadModule();
  });

  it('sends OAuth to a valid HTTPS from_url, NOT a custom scheme (Base44 rejects custom schemes)', () => {
    // Regression guard: Base44 returns "Domain is not valid" for a custom-scheme
    // from_url. The native flow must always use the valid https callback domain.
    expect(nativeAuth.WEB_AUTH_CALLBACK_URL).toBe('https://app.ruumrapp.com/auth/callback');
    expect(nativeAuth.WEB_AUTH_CALLBACK_URL.startsWith('https://')).toBe(true);
    expect(nativeAuth.getWebAuthCallbackUrl()).toBe(
      'https://app.ruumrapp.com/auth/callback?native_platform=ios'
    );
  });

  it('opens Google OAuth with the valid-domain native from_url', async () => {
    await nativeAuth.openNativeProviderLogin('google');

    expect(mockBrowserOpen).toHaveBeenCalledTimes(1);
    const [{ url }] = mockBrowserOpen.mock.calls[0];
    const loginUrl = new URL(url);
    const fromUrl = new URL(loginUrl.searchParams.get('from_url'));

    expect(loginUrl.origin).toBe('https://app.ruumrapp.com');
    expect(loginUrl.pathname).toBe('/api/apps/auth/login');
    expect(loginUrl.searchParams.get('app_id')).toBe('68c919adff6ac6fafb51bed6');
    expect(fromUrl.origin).toBe('https://app.ruumrapp.com');
    expect(fromUrl.pathname).toBe('/auth/callback');
    expect(fromUrl.searchParams.get('native_platform')).toBe('ios');
  });

  it('opens Apple OAuth with the valid-domain from_url', async () => {
    await nativeAuth.openNativeProviderLogin('apple');

    const [{ url }] = mockBrowserOpen.mock.calls[0];
    const loginUrl = new URL(url);
    const fromUrl = new URL(loginUrl.searchParams.get('from_url'));

    expect(loginUrl.pathname).toBe('/api/apps/auth/apple/login');
    expect(fromUrl.origin).toBe('https://app.ruumrapp.com');
    expect(fromUrl.pathname).toBe('/auth/callback');
    expect(fromUrl.searchParams.get('native_platform')).toBe('ios');
  });

  it('selects the iOS custom scheme on iOS', () => {
    expect(nativeAuth.getNativeAuthScheme()).toBe('com.ruumr.app');
    expect(nativeAuth.getNativeAuthCallbackUrl()).toBe('com.ruumr.app://auth/callback');
  });

  it('selects the Android custom scheme on Android', async () => {
    mockPlatform = 'android';
    await loadModule();
    expect(nativeAuth.getNativeAuthScheme()).toBe('com.ruumr.app.android');
    expect(nativeAuth.getNativeAuthCallbackUrl()).toBe('com.ruumr.app.android://auth/callback');
    expect(nativeAuth.getWebAuthCallbackUrl()).toBe(
      'https://app.ruumrapp.com/auth/callback?native_platform=android'
    );
  });

  it('handles the iOS custom-scheme callback token and persists auth hints', async () => {
    const onToken = vi.fn();

    const handled = await nativeAuth.handleNativeAuthCallbackUrl(
      'com.ruumr.app://auth/callback?access_token=abc123&provider=apple&name=Jane%20Appleseed&is_new_user=true',
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

  it('ignores a callback URL that carries no access_token', async () => {
    const onToken = vi.fn();

    const handled = await nativeAuth.handleNativeAuthCallbackUrl(
      'com.ruumr.app://auth/callback',
      { onToken }
    );

    expect(handled).toBe(false);
    expect(onToken).not.toHaveBeenCalled();
  });

  it('ignores unrelated appUrlOpen URLs', async () => {
    const onToken = vi.fn();

    const handled = await nativeAuth.handleNativeAuthCallbackUrl('https://app.ruumrapp.com/', { onToken });

    expect(handled).toBe(false);
    expect(onToken).not.toHaveBeenCalled();
    expect(mockBrowserClose).not.toHaveBeenCalled();
  });
});
