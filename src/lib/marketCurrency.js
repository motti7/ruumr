// Money display and budget scales per marketplace.
// The US (and any other country) market works in US dollars with a USD-scale
// slider; the Israeli marketplace keeps its shekel scale unchanged.
import { REGIONS, getMarketRegion } from './userRegion';

export const ISRAEL_BUDGET = {
  min: 1000,
  max: 10000,
  step: 100,
  // Starting point for a new profile's monthly roommate budget.
  default: 3500,
  apartmentDefault: 5000,
};

export const US_BUDGET = {
  min: 500,
  max: 5000,
  step: 50,
  default: 1800,
  apartmentDefault: 3500,
};

export function getBudgetConfig(market = getMarketRegion()) {
  return market === REGIONS.US ? US_BUDGET : ISRAEL_BUDGET;
}

// Symbol used for the current user's own budget input and filters.
export function getCurrencySymbol(market = getMarketRegion()) {
  return market === REGIONS.US ? '$' : '₪';
}

// Symbol for a budget shown on someone else's profile, taken from the region
// stored on that profile.
export function getProfileCurrency(profileRegion) {
  return profileRegion === REGIONS.US || profileRegion === REGIONS.INTERNATIONAL ? '$' : '₪';
}

export function formatBudget(amount, currency) {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return '-';
  return `${currency}${amount.toLocaleString()}`;
}