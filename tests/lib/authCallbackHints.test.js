import { beforeEach, describe, expect, it } from 'vitest';

import {
  captureAuthCallbackHints,
  clearAuthCallbackHints,
  getStoredAuthCallbackHints,
  persistAuthCallbackHints,
} from '@/lib/authCallbackHints';

describe('authCallbackHints helpers', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('captures Apple auth hints only when an access token is present', () => {
    expect(
      captureAuthCallbackHints(new URLSearchParams('access_token=abc123&provider=apple&auth_method=apple&name=John%20Appleseed'))
    ).toEqual({
      provider: 'apple',
      auth_method: 'apple',
      name: 'John Appleseed',
    });

    expect(captureAuthCallbackHints(new URLSearchParams('provider=apple&name=John%20Appleseed'))).toBeNull();
  });

  it('persists and clears callback hints in sessionStorage', () => {
    persistAuthCallbackHints({
      provider: 'apple',
      name: 'John Appleseed',
    });

    expect(getStoredAuthCallbackHints()).toEqual({
      provider: 'apple',
      name: 'John Appleseed',
    });

    clearAuthCallbackHints();

    expect(getStoredAuthCallbackHints()).toBeNull();
  });
});
