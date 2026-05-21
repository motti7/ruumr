import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mixpanelMock = vi.hoisted(() => ({
  init: vi.fn(),
  track: vi.fn(),
  identify: vi.fn(),
  people: {
    set: vi.fn(),
  },
}));

vi.mock('mixpanel-browser', () => ({
  default: mixpanelMock,
}));

const loadTrackingModule = async (token = '') => {
  vi.resetModules();
  vi.stubEnv('VITE_MIXPANEL_TOKEN', token);
  return import('@/lib/mixpanelTracking');
};

describe('mixpanelTracking', () => {
  beforeEach(() => {
    mixpanelMock.init.mockReset();
    mixpanelMock.track.mockReset();
    mixpanelMock.identify.mockReset();
    mixpanelMock.people.set.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('skips all Mixpanel calls when the token is missing', async () => {
    vi.stubGlobal('window', { location: { hostname: 'app.ruumr.test' } });
    const { identifyMixpanelUser, initMixpanel, trackMixpanel } = await loadTrackingModule('');

    expect(initMixpanel()).toBe(false);
    expect(trackMixpanel('Registration Step Completed', { step_number: 1 })).toBe(false);
    expect(identifyMixpanelUser('user-1', { user_id: 'user-1' })).toBe(false);

    expect(mixpanelMock.init).not.toHaveBeenCalled();
    expect(mixpanelMock.track).not.toHaveBeenCalled();
    expect(mixpanelMock.identify).not.toHaveBeenCalled();
    expect(mixpanelMock.people.set).not.toHaveBeenCalled();
  });

  it('filters localhost, preview, and Base44 hosts', async () => {
    const { isMixpanelHostAllowed } = await loadTrackingModule('token-123');

    expect(isMixpanelHostAllowed('localhost')).toBe(false);
    expect(isMixpanelHostAllowed('preview-sandbox.base44.app')).toBe(false);
    expect(isMixpanelHostAllowed('app.base44.app')).toBe(false);
    expect(isMixpanelHostAllowed('app.ruumr.test')).toBe(true);
  });

  it('does not let a thrown track call break the caller flow', async () => {
    vi.stubGlobal('window', { location: { hostname: 'app.ruumr.test' } });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { trackMixpanel } = await loadTrackingModule('token-123');
    const error = new Error('not initialized');
    mixpanelMock.track.mockImplementation(() => {
      throw error;
    });

    expect(trackMixpanel('Registration Step Completed', { step_number: 1 })).toBe(false);
    expect(warnSpy).toHaveBeenCalledWith(
      'Mixpanel track failed for "Registration Step Completed":',
      error
    );
  });

  it('does not let a thrown identify call break authentication', async () => {
    vi.stubGlobal('window', { location: { hostname: 'app.ruumr.test' } });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { identifyMixpanelUser } = await loadTrackingModule('token-123');
    const error = new Error('not initialized');
    mixpanelMock.identify.mockImplementation(() => {
      throw error;
    });

    expect(identifyMixpanelUser('user-1', { user_id: 'user-1' })).toBe(false);
    expect(warnSpy).toHaveBeenCalledWith('Mixpanel identify failed:', error);
  });
});
