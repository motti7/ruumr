import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

const mockLoginWithProvider = vi.fn();

vi.mock('@/api/base44Client', () => ({
  base44: {
    auth: {
      loginWithProvider: (...args) => mockLoginWithProvider(...args),
    },
  },
}));

vi.mock('@/lib/auth-return-url', () => ({
  getSafeAuthReturnUrl: () => 'https://app.ruumrapp.com/Discover',
}));

describe('AuthRequiredLogin', () => {
  let AuthRequiredLogin;

  beforeEach(async () => {
    vi.resetModules();
    mockLoginWithProvider.mockClear();
    const mod = await import('@/components/AuthRequiredLogin');
    AuthRequiredLogin = mod.default;
  });

  it('starts app-specific Google OAuth with a safe return URL', () => {
    render(<AuthRequiredLogin />);

    fireEvent.click(screen.getByText('כניסה עם Google'));

    expect(mockLoginWithProvider).toHaveBeenCalledWith('google', 'https://app.ruumrapp.com/Discover');
  });

  it('starts app-specific Apple OAuth with a safe return URL', () => {
    render(<AuthRequiredLogin />);

    fireEvent.click(screen.getByText('כניסה עם Apple'));

    expect(mockLoginWithProvider).toHaveBeenCalledWith('apple', 'https://app.ruumrapp.com/Discover');
  });
});
