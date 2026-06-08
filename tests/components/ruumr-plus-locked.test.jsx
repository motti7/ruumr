import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

vi.mock('@/entities/User', () => ({
  // Entitled user so the route-level gate lets us reach the page; the locked
  // panel is the entitled-but-service-403 fallback.
  User: { me: vi.fn().mockResolvedValue({ id: 'u1', full_name: 'Tester', role: 'user', is_ruumr_plus: true }) },
}));
vi.mock('@/entities/Profile', () => ({
  Profile: {
    filter: vi.fn().mockResolvedValue([{ id: 'p1', user_id: 'u1', name: 'Tester' }]),
    list: vi.fn().mockResolvedValue([{ id: 'p1', user_id: 'u1', name: 'Tester' }]),
  },
}));
vi.mock('@/entities/all', () => ({
  Swipe: { filter: vi.fn().mockResolvedValue([]) },
}));
vi.mock('@/api/base44Client', () => ({
  base44: { analytics: { track: vi.fn() } },
}));
vi.mock('@/api/questionnairePreferences', () => ({
  resolveCurrentQuestionnairePreference: vi.fn().mockResolvedValue({
    complete: true,
    preference: {
      answers: {
        q_smoking: 'a',
        q_partners: 'a',
        q_pets: 'a',
        q_cleaning_strictness: 'a',
        q_shopping: 'a',
        q_dishes: 'a',
        q_ac: 'a',
        q_hosting: 'a',
      },
    },
  }),
}));
vi.mock('@/lib/mixpanelTracking', () => ({ trackMixpanel: vi.fn() }));
vi.mock('@/lib/simulatorMode', () => ({
  isRuumrSimulatorMode: () => false,
  isRuumrSimulatorPlusLocked: () => false,
}));
vi.mock('@/lib/swipeMatchProcessing', () => ({ processSwipeMatch: vi.fn() }));
vi.mock('@/components/shared/SmartImage', () => ({ default: () => null }));
vi.mock('@/lib/interests', () => ({ getInterestLabel: (value) => value }));

const lockedError = Object.assign(new Error('locked'), { status: 403 });
vi.mock('@/api/ruumrPlus', () => ({
  activateRuumrPlusRecommendations: vi.fn().mockRejectedValue(lockedError),
  mergeRuumrPlusRecommendations: vi.fn().mockReturnValue([]),
  RUUMR_PLUS_RECOMMENDATION_LIMIT: 5,
  syncCurrentProfileToRuumrPlus: vi.fn().mockResolvedValue({ ok: true }),
}));
vi.mock('@/lib/ruumrPlusSimulator', () => ({
  buildSimulatorRuumrPlusRecommendations: vi.fn(),
}));
vi.mock('@/lib/ruumrPlusActivation', () => ({
  buildRuumrPlusActivationRecord: vi.fn((x) => x),
  consumeRuumrPlusActivationIntent: vi.fn().mockReturnValue(null),
  clearRuumrPlusActivation: vi.fn(),
  getRuumrPlusActivationRemainingMs: vi.fn().mockReturnValue(0),
  isRuumrPlusActivationFresh: vi.fn().mockReturnValue(false),
  loadRuumrPlusActivation: vi.fn().mockReturnValue(null),
  saveRuumrPlusActivation: vi.fn((id, record) => record),
  normalizeRuumrPlusActivation: vi.fn((x) => x),
}));

let RuumrPlusPage;

beforeEach(async () => {
  vi.resetModules();
  RuumrPlusPage = (await import('@/pages/RuumrPlus')).default;
});

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/RuumrPlus']}>
      <RuumrPlusPage />
    </MemoryRouter>
  );
}

const ACTIVATE = /הפעל\/י Plus/;

describe('RuumrPlus locked state', () => {
  it('shows a clear locked panel with an escape route after a 403, and no looping activate', async () => {
    renderPage();

    // Wait until the profile loads and the activate button is enabled, then activate.
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: ACTIVATE })[0].disabled).toBe(false);
    });
    fireEvent.click(screen.getAllByRole('button', { name: ACTIVATE })[0]);

    // The dedicated locked panel renders.
    const heading = await screen.findByText('Ruumr Plus עדיין לא זמין לחשבון שלך');

    // The escape route lives inside the locked panel itself (not just the
    // always-present quick-links section), so scope the assertion to the panel.
    const panel = heading.parentElement;
    expect(within(panel).getByText('המשך/י ל-Discover')).toBeTruthy();

    // The misleading empty-state copy is gone.
    expect(screen.queryByText(/לחיצה על Plus תחשב 5 התאמות/)).toBeNull();

    // The hero activate button is now disabled (relabeled), so it cannot loop on the 403.
    await waitFor(() => {
      const heroButton = screen.getByRole('button', { name: /Plus עדיין לא זמין/ });
      expect(heroButton.disabled).toBe(true);
    });
  });
});
