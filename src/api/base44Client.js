import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';
import { isRuumrSimulatorMode } from '@/lib/simulatorMode';
import { enableSimulatorBackend } from '@/lib/simulatorBackend';
import { isExcludedUser } from '@/lib/mixpanelTracking';

const { appId, serverUrl, appBaseUrl, token, functionsVersion } = appParams;
const simulatorMode = isRuumrSimulatorMode();

//Create a client with authentication required
export const base44 = createClient({
  appId,
  serverUrl,
  appBaseUrl,
  token,
  functionsVersion,
  requiresAuth: false
});

// Wrap analytics.track to exclude internal users
const _originalTrack = base44.analytics.track.bind(base44.analytics);
base44.analytics.track = (...args) => {
  if (isExcludedUser()) return;
  return _originalTrack(...args);
};

if (simulatorMode) {
  enableSimulatorBackend(base44);
}