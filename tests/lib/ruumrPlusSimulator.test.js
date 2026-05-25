import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildSimulatorRuumrPlusRecommendations } from '@/lib/ruumrPlusSimulator';

const requestor = {
  user_id: 'sim_r1',
  name: 'R',
  age: 27,
  gender: 'female',
  looking_for_gender: 'male',
  current_status: 'seeking_apartment',
  search_cities: ['SimCity'],
  budget_min: 3000,
  budget_max: 5000,
  vibe_level: 4,
  smoking_preference: 'flow',
  pet_preference: 'flow',
  kosher_preference: 'flow',
  shabbat_preference: 'flow',
  is_visible: true,
};

const candidate = {
  ...requestor,
  user_id: 'sim_c1',
  name: 'C',
  gender: 'male',
  looking_for_gender: 'female',
  current_status: 'has_apartment',
};

describe('buildSimulatorRuumrPlusRecommendations entitlement gating', () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => window.localStorage.clear());

  it('grants access and returns a response when not locked', async () => {
    const res = await buildSimulatorRuumrPlusRecommendations({
      userId: 'sim_r1',
      requirePlus: true,
      currentProfile: requestor,
      localProfiles: [requestor, candidate],
    });
    expect(res.ok).toBe(true);
    expect(res.access_granted).toBe(true);
  });

  it('throws a 403 when the simulator Plus-locked flag is set', async () => {
    window.localStorage.setItem('ruumr_simulator_plus_locked', 'true');
    await expect(
      buildSimulatorRuumrPlusRecommendations({
        userId: 'sim_r1',
        requirePlus: true,
        currentProfile: requestor,
        localProfiles: [requestor, candidate],
      })
    ).rejects.toMatchObject({ status: 403 });
  });

  it('does not gate when require_plus is false even if locked', async () => {
    window.localStorage.setItem('ruumr_simulator_plus_locked', 'true');
    const res = await buildSimulatorRuumrPlusRecommendations({
      userId: 'sim_r1',
      requirePlus: false,
      currentProfile: requestor,
      localProfiles: [requestor, candidate],
    });
    expect(res.ok).toBe(true);
    expect(res.access_granted).toBe(false);
  });
});
