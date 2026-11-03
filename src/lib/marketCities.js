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

// Major US metros, NYC boroughs and the college towns roommates search most.
export const US_CITIES = [
  "New York", "Brooklyn", "Queens", "Manhattan", "Bronx", "Jersey City", "Hoboken",
  "Los Angeles", "San Francisco", "San Diego", "San Jose", "Oakland", "Berkeley",
  "Sacramento", "Fresno", "Long Beach", "Santa Monica", "Pasadena", "Irvine",
  "Anaheim", "Riverside", "Santa Ana", "Chula Vista", "Stockton", "Modesto",
  "Chicago", "Evanston", "Naperville", "Houston", "Austin", "Dallas", "Fort Worth",
  "Arlington", "Plano", "Irving", "Garland", "San Antonio", "El Paso", "Corpus Christi",
  "Laredo", "College Station", "Phoenix", "Tucson", "Mesa", "Chandler", "Scottsdale",
  "Gilbert", "Glendale", "Tempe", "Philadelphia", "Pittsburgh", "Allentown",
  "Jacksonville", "Miami", "Tampa", "Orlando", "St. Petersburg", "Tallahassee",
  "Gainesville", "Hialeah", "Fort Lauderdale", "Columbus", "Cleveland", "Cincinnati",
  "Toledo", "Indianapolis", "Fort Wayne", "Seattle", "Spokane", "Tacoma", "Denver",
  "Boulder", "Colorado Springs", "Aurora", "Washington", "Arlington", "Boston",
  "Cambridge", "Somerville", "Worcester", "Baltimore", "Annapolis", "Nashville",
  "Memphis", "Knoxville", "Chattanooga", "Louisville", "Lexington", "Detroit",
  "Ann Arbor", "Grand Rapids", "Lansing", "Milwaukee", "Madison", "Minneapolis",
  "Saint Paul", "Oklahoma City", "Tulsa", "Portland", "Eugene", "Las Vegas",
  "Henderson", "Reno", "Albuquerque", "Santa Fe", "Salt Lake City", "Provo",
  "Atlanta", "Athens", "Savannah", "Charlotte", "Raleigh", "Durham", "Greensboro",
  "Chapel Hill", "Asheville", "Richmond", "Virginia Beach", "Norfolk", "New Orleans",
  "Baton Rouge", "Birmingham", "Huntsville", "Kansas City", "St. Louis", "Omaha",
  "Lincoln", "Des Moines", "Wichita", "Boise", "Honolulu", "Anchorage", "Buffalo",
  "Rochester", "Syracuse", "Albany", "Newark", "New Haven", "Hartford",
  "Providence", "Portland", "Burlington", "Wilmington", "Charleston", "Columbia",
  "Little Rock", "Jackson", "Jacksonville", "Fayetteville", "Greenville",
  "Colorado Springs", "Fort Collins", "Sioux Falls", "Fargo", "Billings",
  "Cheyenne", "Vancouver", "Salem", "Bakersfield", "Oxnard", "Fontana"
].sort();

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