import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSignIn = vi.fn();
let mockPlatform = 'ios';
let mockNative = true;
let mockPluginAvailable = true;

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => mockNative,
    getPlatform: () => mockPlatform,
    isPluginAvailable: () => mockPluginAvailable,
  },
  registerPlugin: () => ({ signIn: (...args) => mockSignIn(...args) }),
}));

const mockHandle = vi.fn();
vi.mock('@/lib/nativeAuth', () => ({
  buildNativeProviderLoginUrl: (provider) =>
    `https://app.ruumrapp.com/api/apps/auth/${provider === 'google' ? '' : provider + '/'}login?from_url=cb`,
  getNativeAuthScheme: () => 'com.ruumr.app',
  handleNativeAuthCallbackUrl: (...args) => mockHandle(...args),
}));

import { isWebAuthSessionAvailable, signInWithWebAuthSession } from '@/lib/webAuthSession';

describe('webAuthSession', () => {
  beforeEach(() => {
    mockPlatform = 'ios';
    mockNative = true;
    mockPluginAvailable = true;
    mockSignIn.mockReset();
    mockHandle.mockReset();
  });

  it('is available on iOS native with the plugin present', () => {
    expect(isWebAuthSessionAvailable()).toBe(true);
  });

  it('is not available on Android', () => {
    mockPlatform = 'android';
    expect(isWebAuthSessionAvailable()).toBe(false);
  });

  it('is not available when the native plugin is missing', () => {
    mockPluginAvailable = false;
    expect(isWebAuthSessionAvailable()).toBe(false);
  });

  it('runs the session and routes the returned token through onToken', async () => {
    const onToken = vi.fn();
    mockSignIn.mockResolvedValue({ url: 'com.ruumr.app://auth/callback?access_token=tok123' });
    mockHandle.mockResolvedValue(true);

    const res = await signInWithWebAuthSession('apple', { onToken });

    expect(mockSignIn).toHaveBeenCalledWith({
      url: expect.stringContaining('/api/apps/auth/apple/login'),
      callbackScheme: 'com.ruumr.app',
    });
    expect(mockHandle).toHaveBeenCalledWith(
      'com.ruumr.app://auth/callback?access_token=tok123',
      { onToken }
    );
    expect(res).toEqual({ canceled: false, handled: true });
  });

  it('returns canceled (no throw) when the user dismisses the session', async () => {
    const err = new Error('Sign in canceled');
    err.code = 'CANCELED';
    mockSignIn.mockRejectedValue(err);

    const res = await signInWithWebAuthSession('google', {});
    expect(res).toEqual({ canceled: true, handled: false });
    expect(mockHandle).not.toHaveBeenCalled();
  });

  it('throws when the session returns no callback URL', async () => {
    mockSignIn.mockResolvedValue({});
    await expect(signInWithWebAuthSession('apple', {})).rejects.toThrow(/callback URL/);
  });
});
