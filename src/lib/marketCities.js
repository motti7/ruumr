// City lists per marketplace. The picker and the Discover filters both read
// from here so every market shows the right country's cities.
import { REGIONS, getMarketRegion, resolveRegion } from './userRegion';

export const ISRAEL_CITIES = [
  "תל אביב-יפו", "ירושלים", "חיפה", "ראשון לציון", "פתח תקווה", "אשדוד", "נתניה", "באר שבע", "בני ברק", "חולון",
  "רמת גן", "אשקלון", "רחובות", "בת ים", "הרצליה", "כפר סבא", "חדרה", "מודיעין-מכבים-רעות", "לוד", "רעננה",
  "רמלה", "נצרת", "בית שמש", "נהריה", "קריית אתא", "גבעתיים", "קריית גת", "אילת", "עכו", "הוד השרון",
  "כרמיאל", "טבריה", "עפולה", "נס ציונה", "קריית מוצקין", "ראש העין", "קריית ים", "קריית ביאליק", "רמת השרון",
  "דימונה", "יבנה", "אור יהודה", "נתיבות", "יהוד-מונוסון", "צפת", "קריית אונו", "מגדל העמק", "ערד", "טמרה",
  "קצרין", "קריית שמונה", "סח'נין", "נשר", "מעלות-תרשיחא", "אופקים", "שדרות", "גבעת שמואל", "טירה", "טייבה"].
sort();

// Shorter, conversational city names used for the Discover filter suggestions
// in the Israeli marketplace (matches how people write city names day to day).
export const ISRAEL_FILTER_CITIES = [
  "תל אביב", "ירושלים", "חיפה", "ראשון לציון", "פתח תקווה", "אשדוד", "נתניה", "באר שבע",
  "בני ברק", "חולון", "רמת גן", "אשקלון", "רחובות", "בת ים", "בית שמש", "כפר סבא",
  "הרצליה", "חדרה", "מודיעין", "לוד", "נס ציונה", "רמלה", "רעננה", "פ\"ת", "גבעתיים",
  "קריית גת", "אילת", "נהריה", "עפולה", "רהט", "קריית ביאליק", "קריית ים", "קריית מוצקין",
  "אום אל פחם", "הוד השרון", "טבריה", "קריית אתא", "קריית שמונה", "יבנה", "גבעת שמואל",
  "ראש העין", "נצרת", "נצרת עילית", "עכו", "כפר יונה", "אור יהודה", "מזכרת בתיה",
  "קרית אונו", "גדרה", "מעלה אדומים"
];

export const UK_CITIES = [
  "London", "Manchester", "Birmingham", "Leeds", "Glasgow", "Edinburgh", "Liverpool",
  "Bristol", "Sheffield", "Newcastle upon Tyne", "Nottingham", "Cardiff", "Belfast",
  "Leicester", "Coventry", "Brighton and Hove", "Kingston upon Hull", "Plymouth",
  "Stoke-on-Trent", "Derby", "Southampton", "York", "Oxford", "Cambridge", "Reading",
  "Sunderland", "Aberdeen", "Bath", "Swansea", "Newport", "Middlesbrough",
  "Bournemouth", "Portsmouth", "Luton", "Watford", "Milton Keynes", "Exeter",
  "Gloucester", "Chester", "Dundee", "Inverness", "Wolverhampton", "Wakefield",
  "Bolton", "Bradford", "Oldham", "Rochdale", "Salford", "Stockport", "Blackpool",
  "Preston", "Wigan", "Burnley", "St Albans", "Chelmsford", "Norwich", "Canterbury",
  "Winchester", "Salisbury", "Durham", "Lincoln", "Carlisle"
].sort();

// The US marketplace launches with a focused list of metros rather than every
// city: the profile search area, the Discover filter and the room publisher form
// all offer exactly these.
export const US_CITIES = [
  "Atlanta", "Austin", "Boston", "Chicago", "Denver", "Los Angeles", "Miami",
  "Philadelphia", "Phoenix", "San Diego", "Seattle", "Washington DC"
];

const CITY_LISTS = {
  [REGIONS.ISRAEL]: ISRAEL_CITIES,
  [REGIONS.UK]: UK_CITIES,
  [REGIONS.IRELAND]: UK_CITIES,
  [REGIONS.US]: US_CITIES,
  [REGIONS.INTERNATIONAL]: US_CITIES,
};

// Full picker list for the current marketplace.
export function getMarketCities(market = getMarketRegion()) {
  return CITY_LISTS[market] || US_CITIES;
}

// Shorter suggestion list for the Discover city filter (US and UK markets use
// their full list; Israel keeps its conversational city names).
export function getMarketFilterCities(region = resolveRegion()) {
  if (region === REGIONS.ISRAEL) return ISRAEL_FILTER_CITIES;
  return getMarketCities(getMarketRegion());
}

// Cities a room listing can be published in. The backend validates against the
// same two sets, so keep them in sync with validateRoom in roomListings.
export const ISRAEL_ROOM_CITIES = ["תל אביב", "ירושלים", "חיפה", "באר שבע"];

export function getRoomCityOptions(market = getMarketRegion()) {
  return market === REGIONS.US ? US_CITIES : ISRAEL_ROOM_CITIES;
}