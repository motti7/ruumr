import { beforeEach, describe, expect, it } from 'vitest';

import {
  APPLE_IDENTITY_CACHE_KEY,
  LAST_AUTH_PROVIDER_KEY,
  clearClientUserData,
} from '@/lib/clientSessionCleanup';

describe('clientSessionCleanup', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('clears Apple auth hints during cleanup', async () => {
    window.localStorage.setItem(
      APPLE_IDENTITY_CACHE_KEY,
      JSON.stringify({
        'apple-user-1': {
          fullName: 'John Appleseed',
          email: 'john@example.com',
        },
      })
    );
    window.localStorage.setItem(LAST_AUTH_PROVIDER_KEY, 'apple');
    window.localStorage.setItem('base44_access_token', 'token-123');
    window.sessionStorage.setItem('temp-state', 'keep-me-out');

    await clearClientUserData();

    expect(window.localStorage.getItem(APPLE_IDENTITY_CACHE_KEY)).toBeNull();
    expect(window.localStorage.getItem(LAST_AUTH_PROVIDER_KEY)).toBeNull();
    expect(window.localStorage.getItem('base44_access_token')).toBeNull();
    expect(window.sessionStorage.getItem('temp-state')).toBeNull();
  });
});
