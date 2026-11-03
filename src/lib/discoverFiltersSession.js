// In-session cache for Discover filters. Lives for the duration of the app
// session (survives navigation between screens) and clears when the app is
// closed or refreshed — intentionally NOT persisted to localStorage so filters
// don't stick across launches.
import { getBudgetConfig } from './marketCurrency';

export const getDefaultDiscoverFilters = () => ({
  cities: [],
  minBudget: 0,
  maxBudget: getBudgetConfig().max,
  minAge: 18,
  maxAge: 60,
  kosher: 'all',
  shabbat: 'all',
  apartmentStatus: 'all',
});

let sessionFilters = null;

export const getDiscoverFilters = () => (sessionFilters ? { ...sessionFilters } : null);

export const setDiscoverFilters = (filters) => {
  sessionFilters = filters ? { ...filters } : null;
};