import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const RUUMR_APP_ID = '68c919adff6ac6fafb51bed6';
const DEFAULT_BASE44_URL = 'https://api.base44.app';

const loadAppParams = async ({
  url = '/',
  appId = '',
  serverUrl = '',
  appBaseUrl = '',
} = {}) => {
  vi.resetModules();
  vi.stubEnv('VITE_BASE44_APP_ID', appId);
  vi.stubEnv('VITE_BASE44_BACKEND_URL', serverUrl);
  vi.stubEnv('VITE_BASE44_APP_BASE_URL', appBaseUrl);
  window.history.replaceState({}, '', url);

  const { appParams } = await import('@/lib/app-params');
  return appParams;
};

describe('app params', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('falls back to public Ruumr Base44 routing when env and URL params are missing', async () => {
    const appParams = await loadAppParams();

    expect(appParams.appId).toBe(RUUMR_APP_ID);
    expect(appParams.serverUrl).toBe(DEFAULT_BASE44_URL);
    expect(appParams.appBaseUrl).toBe(DEFAULT_BASE44_URL);
  });

  it('keeps env values as overrides', async () => {
    const appParams = await loadAppParams({
      appId: 'env-app-id',
      serverUrl: 'https://env-backend.example',
      appBaseUrl: 'https://env-app.example',
    });

    expect(appParams.appId).toBe('env-app-id');
    expect(appParams.serverUrl).toBe('https://env-backend.example');
    expect(appParams.appBaseUrl).toBe('https://env-app.example');
  });

  it('ignores Base44 preview URL params for app routing', async () => {
    const appParams = await loadAppParams({
      url: '/?app_id=query-app-id&server_url=https%3A%2F%2Fquery-backend.example&app_base_url=https%3A%2F%2Fquery-app.example',
      appId: 'env-app-id',
      serverUrl: 'https://env-backend.example',
      appBaseUrl: 'https://env-app.example',
    });

    expect(appParams.appId).toBe('env-app-id');
    expect(appParams.serverUrl).toBe('https://env-backend.example');
    expect(appParams.appBaseUrl).toBe('https://env-app.example');
  });

  it('clears stale stored app routing values from earlier preview sessions', async () => {
    window.localStorage.setItem('base44_app_id', 'stale-app-id');
    window.localStorage.setItem('base44_server_url', 'https://stale-backend.example');
    window.localStorage.setItem('base44_app_base_url', 'https://stale-app.example');

    const appParams = await loadAppParams();

    expect(appParams.appId).toBe(RUUMR_APP_ID);
    expect(appParams.serverUrl).toBe(DEFAULT_BASE44_URL);
    expect(appParams.appBaseUrl).toBe(DEFAULT_BASE44_URL);
    expect(window.localStorage.getItem('base44_app_id')).toBeNull();
    expect(window.localStorage.getItem('base44_server_url')).toBeNull();
    expect(window.localStorage.getItem('base44_app_base_url')).toBeNull();
  });
});
