/**
 * Maps Israeli cities to geographic regions (north / center / south).
 * Returns the dominant region based on majority vote across selected cities.
 */

const CITY_REGION_MAP = {
  // צפון
  'חיפה': 'צפון',
  'נצרת': 'צפון',
  'עכו': 'צפון',
  'נהריה': 'צפון',
  'טבריה': 'צפון',
  'צפת': 'צפון',
  'כרמיאל': 'צפון',
  'עפולה': 'צפון',
  'קרית שמונה': 'צפון',
  'בית שאן': 'צפון',
  'מגדל העמק': 'צפון',
  'נשר': 'צפון',
  'קרית ביאליק': 'צפון',
  'קרית ים': 'צפון',
  'קרית מוצקין': 'צפון',
  'קרית אתא': 'צפון',
  'טירת כרמל': 'צפון',
  'זכרון יעקב': 'צפון',
  'יוקנעם': 'צפון',
  'נוף הגליל': 'צפון',
  'אום אל-פחם': 'צפון',
  'שפרעם': 'צפון',
  'נצרת עילית': 'צפון',
  'מעלות תרשיחא': 'צפון',

  // מרכז
  'תל אביב': 'מרכז',
  'תל-אביב': 'מרכז',
  'תל אביב יפו': 'מרכז',
  'רמת גן': 'מרכז',
  'גבעתיים': 'מרכז',
  'בני ברק': 'מרכז',
  'פתח תקווה': 'מרכז',
  'ראשון לציון': 'מרכז',
  'חולון': 'מרכז',
  'בת ים': 'מרכז',
  'הרצליה': 'מרכז',
  'כפר סבא': 'מרכז',
  'רעננה': 'מרכז',
  'הוד השרון': 'מרכז',
  'רמת השרון': 'מרכז',
  'אור יהודה': 'מרכז',
  'גבעת שמואל': 'מרכז',
  'ראש העין': 'מרכז',
  'לוד': 'מרכז',
  'רמלה': 'מרכז',
  'נס ציונה': 'מרכז',
  'מודיעין': 'מרכז',
  'מודיעין עילית': 'מרכז',
  'אזור': 'מרכז',
  'קרית אונו': 'מרכז',
  'יהוד': 'מרכז',
  'נתניה': 'מרכז',
  'חדרה': 'מרכז',
  'טייבה': 'מרכז',
  'טירה': 'מרכז',
  'קלנסואה': 'מרכז',
  // ירושלים (אזור נפרד)
  'ירושלים': 'ירושלים',
  'בית שמש': 'ירושלים',
  'מעלה אדומים': 'ירושלים',
  'אלעד': 'ירושלים',
  'ביתר עילית': 'ירושלים',

  // דרום
  'באר שבע': 'דרום',
  'אשדוד': 'דרום',
  'אשקלון': 'דרום',
  'אילת': 'דרום',
  'דימונה': 'דרום',
  'נתיבות': 'דרום',
  'ערד': 'דרום',
  'קרית גת': 'דרום',
  'קרית מלאכי': 'דרום',
  'שדרות': 'דרום',
  'אופקים': 'דרום',
  'רהט': 'דרום',
  'לקיה': 'דרום',
  'ירוחם': 'דרום',
  'מצפה רמון': 'דרום',
  'גדרה': 'דרום',
  'יבנה': 'דרום',
  'רחובות': 'דרום',
};

/**
 * Returns the dominant region label for a list of cities.
 * @param {string[]} cities
 * @returns {string|null}
 */
export function getCitiesRegion(cities) {
  if (!cities || cities.length === 0) return null;

  const counts = { 'צפון': 0, 'מרכז': 0, 'דרום': 0, 'ירושלים': 0 };

  for (const city of cities) {
    const region = CITY_REGION_MAP[city?.trim()];
    if (region) counts[region]++;
  }

  const total = counts['צפון'] + counts['מרכז'] + counts['דרום'] + counts['ירושלים'];
  if (total === 0) return null;

  const maxCount = Math.max(counts['צפון'], counts['מרכז'], counts['דרום'], counts['ירושלים']);
  const winners = Object.entries(counts)
    .filter(([, c]) => c === maxCount && c > 0)
    .map(([r]) => r);

  return winners.join(' / ');
}

// Region values are stored/data codes (Hebrew), matching profile.search_area.
// This maps them to i18n catalog keys so the *display* label can be translated
// without changing the stored value.
const REGION_LABEL_KEYS = {
  'צפון': 'area_north',
  'מרכז': 'area_center',
  'דרום': 'area_south',
  'שפלה': 'area_shfela',
  'ירושלים': 'area_jerusalem',
};

/**
 * Translates a region string (possibly a tie like "צפון / מרכז") for display,
 * given a react-i18next t() function. Unknown parts pass through unchanged.
 * @param {string|null|undefined} region
 * @param {(key: string) => string} t
 */
export function translateRegion(region, t) {
  if (!region) return region;
  return String(region)
    .split(' / ')
    .map((part) => {
      const key = REGION_LABEL_KEYS[part.trim()];
      return key ? t(key) : part.trim();
    })
    .join(' / ');
}