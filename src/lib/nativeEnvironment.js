import { Capacitor, registerPlugin } from '@capacitor/core';

const RuumrEnvironment = registerPlugin('RuumrEnvironment', {
  web: () => ({
    isSimulator: async () => ({ isSimulator: false }),
  }),
});

export async function detectNativeIOSSimulator() {
  if (typeof window === 'undefined') {
    return false;
  }

  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') {
    return false;
  }

  try {
    const result = await RuumrEnvironment.isSimulator();
    return Boolean(result?.isSimulator);
  } catch (error) {
    console.warn('[ruumr] Native simulator detection failed:', error);
    return false;
  }
}
