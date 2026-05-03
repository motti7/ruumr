import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';
import { isRuumrSimulatorMode } from '@/lib/simulatorMode';
import { enableSimulatorBackend } from '@/lib/simulatorBackend';

const { appId, serverUrl, token, functionsVersion } = appParams;

//Create a client with authentication required
export const base44 = createClient({
  appId,
  serverUrl,
  token,
  functionsVersion,
  requiresAuth: false
});

if (isRuumrSimulatorMode()) {
  enableSimulatorBackend(base44);
}
