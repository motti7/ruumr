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

  it('upgrades a one-sided Plus match when the other user likes back', async () => {
    const base44 = {
      auth: {},
      entities: {},
      analytics: { cleanup: vi.fn(), track: vi.fn() },
      appLogs: { logUserInApp: vi.fn() },
    };
    enableSimulatorBackend(base44);
    const state = window.__ruumrSimulatorState;
    const currentId = state.currentUser.id;
    const seededOneSidedLike = state.collections.Swipe.find(
      (swipe) => swipe.swiper_id === currentId && swipe.action === 'like' &&
        !state.collections.Swipe.some(
          (candidate) =>
            candidate.swiper_id === swipe.swiped_id &&
            candidate.swiped_id === currentId &&
            candidate.action === 'like'
        )
    );
    const targetId = seededOneSidedLike.swiped_id;

    await base44.entities.Match.create({
      user1_id: currentId,
      user2_id: targetId,
      status: 'active',
      match_type: 'ruumr_plus',
      plus_initiator_id: currentId,
    });
    await base44.entities.Swipe.create({
      swiper_id: targetId,
      swiped_id: currentId,
      action: 'like',
    });

    const direct = await base44.entities.Match.filter({
      user1_id: currentId,
      user2_id: targetId,
    });
    const reverse = await base44.entities.Match.filter({
      user1_id: targetId,
      user2_id: currentId,
    });

    expect([...direct, ...reverse]).toHaveLength(1);
    expect([...direct, ...reverse][0]).toMatchObject({
      match_type: 'mutual',
      plus_initiator_id: currentId,
    });
  });
});
