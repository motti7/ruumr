import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockState = vi.hoisted(() => ({
  nativePlatform: false,
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => mockState.nativePlatform,
    getPlatform: () => 'ios',
  },
}));

import { isRuumrNativeDemoSession, isRuumrSimulatorMode } from '@/lib/simulatorMode';

describe('simulatorMode helpers', () => {
  beforeEach(() => {
    mockState.nativePlatform = false;
    vi.unstubAllEnvs();
    window.localStorage.clear();
  });

  it('does not enable native demo mode in a browser runtime', () => {
    expect(isRuumrNativeDemoSession()).toBe(false);
    expect(isRuumrSimulatorMode()).toBe(false);
  });

  it('does NOT enable native demo mode by default on native without a token (production safety)', () => {
    // A real App Store build must never treat a fresh install (no token) as a
    // demo session — otherwise the reviewer sees mock data. No flag => logged out.
    mockState.nativePlatform = true;

    expect(isRuumrNativeDemoSession()).toBe(false);
    expect(isRuumrSimulatorMode()).toBe(false);
  });

  it('enables native demo mode only when the explicit demo flag is set', () => {
    vi.stubEnv('VITE_RUUMR_NATIVE_DEMO', 'true');
    mockState.nativePlatform = true;

    expect(isRuumrNativeDemoSession()).toBe(true);
    expect(isRuumrSimulatorMode()).toBe(true);
  });

  it('does not enable native demo mode when an access token is present (even with the demo flag on)', () => {
    vi.stubEnv('VITE_RUUMR_NATIVE_DEMO', 'true');
    mockState.nativePlatform = true;
    window.localStorage.setItem('base44_access_token', 'token-value');

    expect(isRuumrNativeDemoSession()).toBe(false);
    expect(isRuumrSimulatorMode()).toBe(false);
  });
});
