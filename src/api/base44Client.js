import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';
import { isRuumrSimulatorMode } from '@/lib/simulatorMode';
import { enableSimulatorBackend } from '@/lib/simulatorBackend';

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

if (simulatorMode) {
  enableSimulatorBackend(base44);
}
