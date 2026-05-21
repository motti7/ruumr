import { beforeEach, describe, expect, it, vi } from 'vitest';
import { enableSimulatorBackend } from '@/lib/simulatorBackend';

describe('simulatorBackend', () => {
  beforeEach(() => {
    window.localStorage.clear();
    delete window.__ruumrSimulatorBackendEnabled;
    delete window.__ruumrSimulatorState;
  });

  it('overrides dynamic Base44 entity proxy access with simulator collections', async () => {
    const remoteFilter = vi.fn();
    const remoteEntities = new Proxy({}, {
      get() {
        return {
          filter: remoteFilter,
          list: vi.fn(),
          create: vi.fn(),
          update: vi.fn(),
          delete: vi.fn(),
          subscribe: vi.fn(),
        };
      },
    });
    const analyticsCleanup = vi.fn();
    const base44 = {
      auth: {},
      entities: remoteEntities,
      analytics: {
        cleanup: analyticsCleanup,
        track: vi.fn(),
      },
      appLogs: {
        logUserInApp: vi.fn(),
      },
    };

    expect(enableSimulatorBackend(base44)).toBe(true);
    expect(window.__ruumrSimulatorState.collections.Match).toHaveLength(1);

    const matches = await base44.entities.Match.list();
    const filteredMatches = await base44.entities.Match.filter({
      user1_id: matches[0]?.user1_id,
      status: matches[0]?.status,
    });
    const profiles = await base44.entities.Profile.filter({
      user_id: 'demo-user-maya',
    });

    expect(remoteFilter).not.toHaveBeenCalled();
    expect(analyticsCleanup).toHaveBeenCalledTimes(1);
    expect(base44.analytics.track({ eventName: 'test' })).toBeUndefined();
    await expect(base44.appLogs.logUserInApp('Discover')).resolves.toBe(true);
    expect(matches).toHaveLength(1);
    expect(filteredMatches).toHaveLength(1);
    expect(profiles[0]?.name).toBe('מאיה לוי');
  });
});
