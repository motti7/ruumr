import { describe, it, expect, beforeEach } from 'vitest';
import { REGIONS, detectRegion, getMarketRegion, showsRoomFeed } from '../../src/lib/userRegion';
import { getMarketCities, getMarketFilterCities, US_CITIES, ISRAEL_CITIES } from '../../src/lib/marketCities';
import { getBudgetConfig, getCurrencySymbol, getProfileCurrency, formatBudget, US_BUDGET, ISRAEL_BUDGET } from '../../src/lib/marketCurrency';

const setTimezone = (timeZone, language = 'en-US') => {
  const original = Intl.DateTimeFormat;
  Intl.DateTimeFormat = /** @type {any} */ (function () {
    return { resolvedOptions: () => ({ timeZone }) };
  });
  Intl.DateTimeFormat.prototype = original.prototype;
  Object.defineProperty(window.navigator, 'language', { value: language, configurable: true });
  Object.defineProperty(window.navigator, 'languages', { value: [language], configurable: true });
  return () => {
    Intl.DateTimeFormat = original;
  };
};

describe('US marketplace', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('detects the US from a US timezone', () => {
    const restore = setTimezone('America/New_York');
    expect(detectRegion()).toBe(REGIONS.US);
    restore();
  });

  it('keeps Israel and UK detection working', () => {
    let restore = setTimezone('Asia/Jerusalem', 'he-IL');
    expect(detectRegion()).toBe(REGIONS.ISRAEL);
    restore();

    restore = setTimezone('Europe/London', 'en-GB');
    expect(detectRegion()).toBe(REGIONS.UK);
    restore();
  });

  it('treats any other country as the US market, never Israel', () => {
    const restore = setTimezone('America/Sao_Paulo', 'pt-BR');
    window.localStorage.clear();
    expect(getMarketRegion()).toBe(REGIONS.US);
    restore();
  });

  it('offers US cities in the US market and Israeli cities in Israel', () => {
    setTimezone('America/Chicago');
    window.localStorage.clear();
    expect(getMarketCities()).toEqual(US_CITIES);
    expect(getMarketCities()).toEqual([
      'Atlanta', 'Austin', 'Boston', 'Chicago', 'Denver', 'Los Angeles',
      'Miami', 'Philadelphia', 'Phoenix', 'San Diego', 'Seattle', 'Washington DC',
    ]);
    expect(getMarketFilterCities()).toContain('Boston');

    window.localStorage.clear();
    setTimezone('Asia/Jerusalem', 'he-IL');
    expect(getMarketCities()).toEqual(ISRAEL_CITIES);
  });

  it('uses a dollar budget scale in the US and shekels in Israel', () => {
    window.localStorage.clear();
    setTimezone('America/Denver');
    expect(getBudgetConfig()).toEqual(US_BUDGET);
    expect(getCurrencySymbol()).toBe('$');

    window.localStorage.clear();
    setTimezone('Asia/Jerusalem', 'he-IL');
    expect(getBudgetConfig()).toEqual(ISRAEL_BUDGET);
    expect(getCurrencySymbol()).toBe('₪');
  });

  it('hides the rooms feed in the US market and keeps it elsewhere', () => {
    window.localStorage.clear();
    setTimezone('America/Los_Angeles');
    expect(showsRoomFeed()).toBe(false);

    window.localStorage.clear();
    setTimezone('Asia/Jerusalem', 'he-IL');
    expect(showsRoomFeed()).toBe(true);

    window.localStorage.clear();
    setTimezone('Europe/Dublin', 'en-IE');
    expect(showsRoomFeed()).toBe(true);
  });

  it('renders a profile budget in that profile market currency', () => {
    expect(formatBudget(1800, getProfileCurrency('US'))).toBe('$1,800');
    expect(formatBudget(3500, getProfileCurrency('IL'))).toBe('₪3,500');
    expect(formatBudget(null, '$')).toBe('-');
  });
});