import { describe, expect, it } from 'vitest';
import {
  RUUMR_PLUS_ACTIVATION_WINDOW_MS,
  isRuumrPlusActivationFresh,
  normalizeRuumrPlusActivation,
} from '@/lib/ruumrPlusActivation';

const NOW = Date.parse('2026-05-26T16:00:00.000Z');

function activation(overrides = {}) {
  return {
    activated_at: new Date(NOW - 60 * 1000).toISOString(),
    expires_at: new Date(NOW + RUUMR_PLUS_ACTIVATION_WINDOW_MS).toISOString(),
    recommendations: [{ user_id: 'match_1' }],
    ...overrides,
  };
}

describe('isRuumrPlusActivationFresh', () => {
  it('uses a 72-hour activation window', () => {
    expect(RUUMR_PLUS_ACTIVATION_WINDOW_MS).toBe(72 * 60 * 60 * 1000);
  });

  it('treats a saved activation with recommendations as fresh inside the 72-hour window', () => {
    expect(isRuumrPlusActivationFresh(activation(), NOW)).toBe(true);
  });

  it('extends previously saved 24-hour records to the 72-hour window', () => {
    const activatedAt = new Date(NOW - 12 * 60 * 60 * 1000);
    const normalized = normalizeRuumrPlusActivation(activation({
      activated_at: activatedAt.toISOString(),
      expires_at: new Date(activatedAt.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    }));

    expect(normalized.expires_at).toBe(
      new Date(activatedAt.getTime() + RUUMR_PLUS_ACTIVATION_WINDOW_MS).toISOString()
    );
  });

  it('does not lock reruns for a saved activation with no recommendations', () => {
    expect(isRuumrPlusActivationFresh(activation({ recommendations: [] }), NOW)).toBe(false);
  });
});
