import { Capacitor } from '@capacitor/core';
import * as CapacitorCore from '@capacitor/core';

let ruumrEnvironmentPlugin = null;

function getRuumrEnvironmentPlugin() {
  if (ruumrEnvironmentPlugin) {
    return ruumrEnvironmentPlugin;
  }

  const registerPlugin = CapacitorCore?.registerPlugin;
  if (typeof registerPlugin !== 'function') {
    return {
      isSimulator: async () => ({ isSimulator: false }),
    };
  }

  ruumrEnvironmentPlugin = registerPlugin('RuumrEnvironment', {
    web: () => ({
      isSimulator: async () => ({ isSimulator: false }),
    }),
  });
  return ruumrEnvironmentPlugin;
}

export function isNativeIOSApp() {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return (
      Capacitor.isNativePlatform() &&
      typeof Capacitor.getPlatform === 'function' &&
      Capacitor.getPlatform() === 'ios'
    );
  } catch {
    return false;
  }
}

export async function detectNativeIOSSimulator() {
  if (typeof window === 'undefined') {
    return false;
  }

  if (!isNativeIOSApp()) {
    return false;
  }

  try {
    const result = await getRuumrEnvironmentPlugin().isSimulator();
    return Boolean(result?.isSimulator);
  } catch (error) {
    console.warn('[ruumr] Native simulator detection failed:', error);
    return false;
  }
}
