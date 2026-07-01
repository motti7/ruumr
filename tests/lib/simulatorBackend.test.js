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
    const targetId = 'demo-user-eitan';
    state.collections.Swipe = state.collections.Swipe.filter(
      (swipe) =>
        !(
          [currentId, targetId].includes(swipe.swiper_id) &&
          [currentId, targetId].includes(swipe.swiped_id)
        )
    );
    state.collections.Match = state.collections.Match.filter(
      (match) =>
        !(
          [currentId, targetId].includes(match.user1_id) &&
          [currentId, targetId].includes(match.user2_id)
        )
    );

    await base44.entities.Match.create({
      user1_id: currentId,
      user2_id: targetId,
      status: 'active',
      match_type: 'ruumr_plus',
      plus_initiator_id: currentId,
    });
    await base44.entities.Swipe.create({
      swiper_id: currentId,
      swiped_id: targetId,
      action: 'like',
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

  it('seeds stage 2 with three apartment suggestions and a full-team coffee chat while waiting for my ranking', async () => {
    window.localStorage.setItem('ruumr_demo_stage', '2');
    const base44 = {
      auth: {},
      entities: {},
      functions: {},
      analytics: { cleanup: vi.fn(), track: vi.fn() },
      appLogs: { logUserInApp: vi.fn() },
    };
    enableSimulatorBackend(base44);

    const result = await base44.functions.invoke('teamApartmentDiscovery', { action: 'ensure' });
    const discovery = result.discovery;

    expect(result.status).toBe('apartment_ranking');
    expect(discovery.lifecycle_state).toBe('APARTMENT_RANKING');
    expect(discovery.suggested_apartments).toHaveLength(3);
    expect(discovery.preferences?.['demo-user-noam']).toBeUndefined();
    expect(discovery.suggested_apartments.every((apartment) => apartment.image.startsWith('https://images.unsplash.com/'))).toBe(true);
    expect(discovery.suggested_apartments.every((apartment) => apartment.images.length >= 3)).toBe(true);

    const groupId = [...discovery.member_user_ids].sort().join('_');
    const messages = await base44.entities.GroupMessage.filter({ group_id: groupId });
    const seededMessages = messages.filter((message) => message.simulator_stage2_group_chat);

    expect(seededMessages).toHaveLength(4);
    expect(seededMessages.map((message) => message.sender_id)).toContain('demo-user-maya');
    expect(seededMessages.map((message) => message.sender_id)).toContain('demo-user-eitan');
    expect(seededMessages.some((message) => message.content_en.includes('coffee'))).toBe(true);
    expect(seededMessages.some((message) => message.content_en.includes('check out'))).toBe(true);
  });
});
