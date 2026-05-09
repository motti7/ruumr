import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/clientSessionCleanup', () => ({
  APPLE_IDENTITY_CACHE_KEY: 'ruumr_apple_identity_by_user_id',
  LAST_AUTH_PROVIDER_KEY: 'ruumr_last_auth_provider',
}));

import {
  getCachedAppleIdentity,
  isAppleAuthUser,
  persistAppleIdentity,
  resolveAppleDisplayName,
} from '@/lib/appleIdentity';

describe('appleIdentity helpers', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('detects Apple-authenticated users from relay email and cached provider', () => {
    expect(
      isAppleAuthUser({
        email: 'user@privaterelay.appleid.com',
      })
    ).toBe(true);

    window.localStorage.setItem('ruumr_last_auth_provider', 'apple');
    expect(isAppleAuthUser({ email: 'user@example.com' })).toBe(true);
  });

  it('persists and reads cached Apple identity', () => {
    persistAppleIdentity('user-1', { fullName: 'John Appleseed', email: 'john@example.com' });

    expect(getCachedAppleIdentity('user-1')).toEqual({
      fullName: 'John Appleseed',
      email: 'john@example.com',
    });
  });

  it('resolves the display name from Apple identity data with a safe fallback', () => {
    expect(
      resolveAppleDisplayName({
        authUser: { full_name: 'John Appleseed' },
      })
    ).toEqual({
      fullName: 'John Appleseed',
      firstName: 'John',
      displayName: 'John Appleseed',
    });

    expect(
      resolveAppleDisplayName({
        userData: {
          given_name: 'John',
          family_name: 'Appleseed',
        },
      })
    ).toEqual({
      fullName: 'John Appleseed',
      firstName: 'John',
      displayName: 'John Appleseed',
    });

    expect(
      resolveAppleDisplayName({
        cachedIdentity: { fullName: '', email: '' },
      })
    ).toEqual({
      fullName: '',
      firstName: '',
      displayName: 'Ruumr user',
    });
  });
});
