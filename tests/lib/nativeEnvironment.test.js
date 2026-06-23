import { beforeEach, describe, expect, it, vi } from 'vitest';

const capState = vi.hoisted(() => ({
  native: false,
  platform: 'web',
  simulator: false,
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => capState.native,
    getPlatform: () => capState.platform,
  },
  registerPlugin: () => ({
    isSimulator: async () => ({ isSimulator: capState.simulator }),
  }),
}));

import { detectNativeIOSSimulator, isNativeIOSApp } from '@/lib/nativeEnvironment';

describe('nativeEnvironment', () => {
  beforeEach(() => {
    capState.native = false;
    capState.platform = 'web';
    capState.simulator = false;
  });

  it('identifies only the native iOS app as iOS native', () => {
    expect(isNativeIOSApp()).toBe(false);

    capState.native = true;
    capState.platform = 'android';
    expect(isNativeIOSApp()).toBe(false);

    capState.platform = 'ios';
    expect(isNativeIOSApp()).toBe(true);
  });

  it('checks simulator state only for native iOS', async () => {
    capState.simulator = true;
    expect(await detectNativeIOSSimulator()).toBe(false);

    capState.native = true;
    capState.platform = 'ios';
    expect(await detectNativeIOSSimulator()).toBe(true);
  });
});
