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
    window.localStorage.clear();
  });

  it('does not enable native demo mode in a browser runtime', () => {
    expect(isRuumrNativeDemoSession()).toBe(false);
    expect(isRuumrSimulatorMode()).toBe(false);
  });

  it('enables native demo mode on a native platform without stored auth tokens', () => {
    mockState.nativePlatform = true;

    expect(isRuumrNativeDemoSession()).toBe(true);
    expect(isRuumrSimulatorMode()).toBe(true);
  });

  it('does not enable native demo mode when an access token is present', () => {
    mockState.nativePlatform = true;
    window.localStorage.setItem('base44_access_token', 'token-value');

    expect(isRuumrNativeDemoSession()).toBe(false);
    expect(isRuumrSimulatorMode()).toBe(false);
  });
});
