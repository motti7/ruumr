import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockSim } = vi.hoisted(() => ({
  mockSim: {
    isRuumrSimulatorMode: vi.fn(),
    isRuumrSimulatorPlusLocked: vi.fn(),
  },
}));

vi.mock('@/lib/simulatorMode', () => mockSim);

import { isPlusEntitled } from '@/lib/ruumrPlusEntitlement';

describe('isPlusEntitled', () => {
  beforeEach(() => {
    mockSim.isRuumrSimulatorMode.mockReturnValue(false);
    mockSim.isRuumrSimulatorPlusLocked.mockReturnValue(false);
  });

  it('reads the is_ruumr_plus flag in production', () => {
    expect(isPlusEntitled({ is_ruumr_plus: true })).toBe(true);
    expect(isPlusEntitled({ is_ruumr_plus: false })).toBe(false);
    expect(isPlusEntitled({})).toBe(false);
    expect(isPlusEntitled(null)).toBe(false);
    expect(isPlusEntitled(undefined)).toBe(false);
  });

  it('in simulator mode, entitlement follows the plus-locked toggle and ignores the flag', () => {
    mockSim.isRuumrSimulatorMode.mockReturnValue(true);

    mockSim.isRuumrSimulatorPlusLocked.mockReturnValue(false);
    expect(isPlusEntitled({ is_ruumr_plus: false })).toBe(true);

    mockSim.isRuumrSimulatorPlusLocked.mockReturnValue(true);
    expect(isPlusEntitled({ is_ruumr_plus: true })).toBe(false);
  });
});
