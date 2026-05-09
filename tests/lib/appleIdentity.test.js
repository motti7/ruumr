import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/clientSessionCleanup', () => ({
  APPLE_IDENTITY_CACHE_KEY: 'ruumr_apple_identity_by_user_id',
  LAST_AUTH_PROVIDER_KEY: 'ruumr_last_auth_provider',
  LAST_USED_AUTH_METHOD_KEY: 'lastUsedAuthMethod',
}));

import {
  getCachedAppleIdentity,
  isAppleAuthUser,
  persistAppleIdentity,
  resolveAppleDisplayName,
  syncAppleDisplayNameToBase44,
} from '@/lib/appleIdentity';

describe('appleIdentity helpers', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('detects Apple-authenticated users from relay email and an explicit Apple provider', () => {
    expect(
      isAppleAuthUser({
        email: 'user@privaterelay.appleid.com',
      })
    ).toBe(true);

    expect(
      isAppleAuthUser({
        email: 'user@example.com',
        auth_provider: 'apple',
      })
    ).toBe(true);
  });

  it('detects Apple-authenticated users from the last used auth method', () => {
    window.localStorage.setItem('lastUsedAuthMethod', 'apple');

    expect(
      isAppleAuthUser({
        email: 'user@example.com',
      })
    ).toBe(true);
  });

  it('detects Apple-authenticated users from cached Apple identity when the provider hint is still available', () => {
    expect(
      isAppleAuthUser(
        {
          email: 'john@example.com',
          full_name: '',
        },
        {
          fullName: 'John Appleseed',
          email: 'john@example.com',
        }
      )
    ).toBe(true);
  });

  it('detects Apple-authenticated users from explicit auth callback hints', () => {
    expect(
      isAppleAuthUser(
        {
          email: 'john@example.com',
          full_name: '',
        },
        null,
        {
          provider: 'apple',
        }
      )
    ).toBe(true);
  });

  it('persists and reads cached Apple identity', () => {
    persistAppleIdentity('user-1', { fullName: 'John Appleseed', email: 'john@example.com' });

    expect(getCachedAppleIdentity('user-1')).toEqual({
      fullName: 'John Appleseed',
      email: 'john@example.com',
    });
  });

  it('removes cached Apple identity when no real Apple name is available', () => {
    persistAppleIdentity('user-1', { fullName: 'John Appleseed', email: 'john@example.com' });
    persistAppleIdentity('user-1', { fullName: '', email: 'john@example.com' });

    expect(getCachedAppleIdentity('user-1')).toBeNull();
    expect(window.localStorage.getItem('ruumr_last_auth_provider')).toBeNull();
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
        authHints: {
          provider: 'apple',
          name: 'John Appleseed',
        },
      })
    ).toEqual({
      fullName: 'John Appleseed',
      firstName: 'John',
      displayName: 'John Appleseed',
    });

    expect(
      resolveAppleDisplayName({
        authUser: {
          profile: {
            full_name: 'John Appleseed',
          },
        },
      })
    ).toEqual({
      fullName: 'John Appleseed',
      firstName: 'John',
      displayName: 'John Appleseed',
    });

    expect(
      resolveAppleDisplayName({
        cachedIdentity: { fullName: 'John Appleseed', email: 'john@example.com' },
        fallbackName: '',
      })
    ).toEqual({
      fullName: '',
      firstName: '',
      displayName: '',
    });

    expect(
      resolveAppleDisplayName({
        cachedIdentity: { fullName: '', email: '' },
        fallbackName: '',
      })
    ).toEqual({
      fullName: '',
      firstName: '',
      displayName: '',
    });
  });

  it('persists the Apple full name back to Base44 when it is available', async () => {
    const updateMe = vi.fn().mockResolvedValue({
      id: 'user-2',
      email: 'john@example.com',
      full_name: 'John Appleseed',
    });

    const updatedUser = await syncAppleDisplayNameToBase44(
      { updateMe },
      {
        id: 'user-2',
        email: 'john@example.com',
        auth_provider: 'apple',
        full_name: '',
      },
      {
        fullName: 'John Appleseed',
      }
    );

    expect(updateMe).toHaveBeenCalledWith({ full_name: 'John Appleseed' });
    expect(updatedUser.full_name).toBe('John Appleseed');
  });

  it('does not write a fallback-only Apple name back to Base44', async () => {
    const updateMe = vi.fn();

    const updatedUser = await syncAppleDisplayNameToBase44(
      { updateMe },
      {
        id: 'user-3',
        email: 'john@example.com',
        auth_provider: 'apple',
        full_name: '',
      }
    );

    expect(updateMe).not.toHaveBeenCalled();
    expect(updatedUser.full_name).toBe('');
  });
});
