import aceLogo from "@/assets/brand-logos/ace.png";
import bezeqLogo from "@/assets/brand-logos/bezeq.png";
import ikeaLogo from "@/assets/brand-logos/ikea.png";
import shufersalLogo from "@/assets/brand-logos/shufersal.png";
import tenbisLogo from "@/assets/brand-logos/tenbis.png";
import woltLogo from "@/assets/brand-logos/wolt.png";

const DEFAULT_CITY_KEY = "tel_aviv";

const CITY_META = {
  tel_aviv: {
    en: "Tel Aviv",
    he: "תל אביב",
    neighborhoodEn: "central Tel Aviv",
    neighborhoodHe: "מרכז תל אביב",
  },
  beer_sheva: {
    en: "Be'er Sheva",
    he: "באר שבע",
    neighborhoodEn: "near campus",
    neighborhoodHe: "ליד הקמפוס",
  },
  jerusalem: {
    en: "Jerusalem",
    he: "ירושלים",
    neighborhoodEn: "near the light rail",
    neighborhoodHe: "ליד הרכבת הקלה",
  },
};

const CATEGORY_META = {
  setup: {
    icon: "plug",
    en: "Apartment setup",
    he: "הקמת הדירה",
    bodyEn: "Israeli internet, utilities, and first-week basics.",
    bodyHe: "אינטרנט ישראלי, תשתיות ודברים שחייבים בשבוע הראשון.",
  },
  moving: {
    icon: "truck",
    en: "Moving & shipping",
    he: "הובלה ומשלוחים",
    bodyEn: "Move together or ship personal items separately.",
    bodyHe: "הובלה משותפת או משלוח אישי של ציוד.",
  },
  furniture: {
    icon: "sofa",
    en: "Furniture",
    he: "ריהוט",
    bodyEn: "Shared pieces, room bundles, and essentials.",
    bodyHe: "ריהוט משותף, חבילות לחדר ודברים בסיסיים.",
  },
  cleaning: {
    icon: "sparkle",
    en: "Cleaning",
    he: "ניקיון",
    bodyEn: "Before move-in, weekly, or post-renovation.",
    bodyHe: "לפני כניסה, שבועי או אחרי שיפוץ.",
  },
  food: {
    icon: "utensils",
    en: "Daily deals",
    he: "דילים יומיומיים",
    bodyEn: "Wolt, Ten Bis, groceries, and everyday household deals.",
    bodyHe: "Wolt, תן ביס, סופר ודילים יומיומיים לבית.",
  },
};

function brandImage({ background, foreground, accent, brand, subtitle, motif = "circle" }) {
  const motifMarkup = motif === "truck"
    ? `<g opacity="0.2" fill="${accent}"><rect x="322" y="326" width="132" height="62" rx="14"/><rect x="406" y="286" width="76" height="102" rx="14"/><circle cx="362" cy="406" r="22"/><circle cx="452" cy="406" r="22"/></g>`
    : motif === "house"
      ? `<path d="M332 304 420 236l88 68v132H358V304Z" fill="${accent}" opacity="0.2"/><path d="M396 436v-72h74v72" fill="${background}" opacity="0.55"/>`
      : motif === "basket"
        ? `<g opacity="0.2" fill="none" stroke="${accent}" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"><path d="M332 332h178l-22 104H354l-22-104Z"/><path d="M380 332l40-78 40 78"/></g>`
        : `<circle cx="420" cy="318" r="118" fill="${accent}" opacity="0.2"/><circle cx="420" cy="318" r="62" fill="${accent}" opacity="0.18"/>`;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 560">
      <rect width="560" height="560" rx="0" fill="${background}"/>
      <path d="M0 0h560v560H0z" fill="${background}"/>
      ${motifMarkup}
      <text x="54" y="252" fill="${foreground}" font-family="Arial, Helvetica, sans-serif" font-size="72" font-weight="900">${brand}</text>
      <text x="58" y="306" fill="${foreground}" opacity="0.82" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="800">${subtitle}</text>
      <rect x="58" y="342" width="184" height="10" rx="5" fill="${accent}" opacity="0.95"/>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const SERVICE_IMAGES = {
  internet: bezeqLogo,
  moving: brandImage({
    background: "#1f2937",
    foreground: "#ffffff",
    accent: "#fb923c",
    brand: "Move TLV",
    subtitle: "Student movers",
    motif: "truck",
  }),
  furniture: ikeaLogo,
  cleaning: brandImage({
    background: "#123c69",
    foreground: "#ffffff",
    accent: "#4dd8c8",
    brand: "Spetz",
    subtitle: "Move-in cleaning",
  }),
  food: woltLogo,
  lunch: tenbisLogo,
  groceries: shufersalLogo,
  household: aceLogo,
};

function cityKeyFromApartment(apartment = {}) {
  const city = String(apartment.city_en || apartment.city || "").toLowerCase();
  if (city.includes("beer") || city.includes("באר")) return "beer_sheva";
  if (city.includes("jerusalem") || city.includes("ירושלים")) return "jerusalem";
  return DEFAULT_CITY_KEY;
}

function stableNumber(input, min, max) {
  let hash = 0;
  const text = String(input || "");
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 33 + text.charCodeAt(index)) >>> 0;
  }
  return min + (hash % (max - min + 1));
}

function withCity(provider, cityKey, index) {
  const city = CITY_META[cityKey] || CITY_META[DEFAULT_CITY_KEY];
  const citySuffix = cityKey === "tel_aviv" ? "TLV" : cityKey === "beer_sheva" ? "Negev" : "JLM";
  return {
    ...provider,
    id: `${provider.id}-${cityKey}`,
    cityKey,
    rating: (4.5 + stableNumber(`${provider.id}:${cityKey}`, 0, 4) / 10).toFixed(1),
    etaEn: provider.etaEn.replace("{{city}}", city.neighborhoodEn),
    etaHe: provider.etaHe.replace("{{city}}", city.neighborhoodHe),
    nameEn: provider.nameEn.replace("{{city}}", citySuffix),
    nameHe: provider.nameHe.replace("{{city}}", city.he),
    rank: index + 1,
  };
}

const PROVIDER_BLUEPRINTS = [
  {
    id: "fiber-fast",
    category: "setup",
    type: "team",
    image: SERVICE_IMAGES.internet,
    nameEn: "Bezeq Fiber",
    nameHe: "בזק Fiber",
    taglineEn: "Fiber internet, Be router, and apartment setup support for new roommates.",
    taglineHe: "אינטרנט סיבים, Be Router ותמיכה בהקמה לדירת שותפים חדשה.",
    priceEn: "₪119-₪149/mo",
    priceHe: "119-149₪ לחודש",
    dealEn: "Installation fee waived in the demo",
    dealHe: "דמי התקנה מבוטלים בדמו",
    etaEn: "Technician window in {{city}}: 2 business days",
    etaHe: "חלון טכנאי ב{{city}}: 2 ימי עסקים",
    primaryAction: "team",
  },
  {
    id: "move-squad",
    category: "moving",
    type: "hybrid",
    image: SERVICE_IMAGES.moving,
    nameEn: "Student Movers TLV",
    nameHe: "הובלות הסטודנטים תל אביב",
    taglineEn: "One Tel Aviv truck route with separate pickup points for each roommate.",
    taglineHe: "מסלול הובלה תל אביבי אחד עם נקודות איסוף נפרדות לכל שותף.",
    priceEn: "₪350-₪950/person",
    priceHe: "350-950₪ לאדם",
    dealEn: "Shared route saves 15%",
    dealHe: "מסלול משותף חוסך 15%",
    etaEn: "Next crew near {{city}}: Friday morning",
    etaHe: "צוות קרוב ל{{city}}: שישי בבוקר",
    primaryAction: "hybrid",
  },
  {
    id: "room-kit",
    category: "furniture",
    type: "hybrid",
    image: SERVICE_IMAGES.furniture,
    nameEn: "IKEA Israel room bundles",
    nameHe: "IKEA ישראל - חבילות חדר",
    taglineEn: "Desk, chair, storage, shared sofa, and kitchen basics with Tel Aviv delivery.",
    taglineHe: "שולחן, כיסא, אחסון, ספה משותפת וציוד מטבח עם משלוח לתל אביב.",
    priceEn: "bundles from ₪790",
    priceHe: "חבילות החל מ-790₪",
    dealEn: "Split sofa and kitchen basics",
    dealHe: "פיצול ספה וציוד מטבח",
    etaEn: "Delivery to {{city}} in 2-4 days",
    etaHe: "משלוח ל{{city}} תוך 2-4 ימים",
    primaryAction: "hybrid",
  },
  {
    id: "fresh-start",
    category: "cleaning",
    type: "team",
    image: SERVICE_IMAGES.cleaning,
    nameEn: "Spetz move-in cleaning",
    nameHe: "Spetz ניקיון לפני כניסה",
    taglineEn: "Deep clean for a Tel Aviv rental: fridge, windows, bathroom, and kitchen.",
    taglineHe: "ניקיון יסודי לדירה שכורה בתל אביב: מקרר, חלונות, מקלחת ומטבח.",
    priceEn: "from ₪320",
    priceHe: "החל מ-320₪",
    dealEn: "Fridge and windows included",
    dealHe: "כולל מקרר וחלונות",
    etaEn: "Open cleaner near {{city}}: tomorrow evening",
    etaHe: "מנקה פנוי/ה ב{{city}}: מחר בערב",
    primaryAction: "team",
  },
  {
    id: "wolt-house",
    category: "food",
    type: "individual",
    image: SERVICE_IMAGES.food,
    nameEn: "Wolt Tel Aviv dinner",
    nameHe: "Wolt תל אביב - ארוחת ערב",
    taglineEn: "Individual roommate orders from nearby restaurants with one shared delivery window.",
    taglineHe: "הזמנות אישיות ממסעדות באזור עם חלון משלוח משותף אחד.",
    priceEn: "personal orders",
    priceHe: "הזמנות אישיות",
    dealEn: "₪25 off first dinner in the new place",
    dealHe: "25₪ הנחה בארוחה הראשונה בדירה",
    etaEn: "Popular around {{city}} tonight: burgers, sushi, bowls",
    etaHe: "פופולרי באזור {{city}} הערב: המבורגר, סושי ובאולים",
    primaryAction: "individual",
  },
  {
    id: "tenbis-lunch",
    category: "food",
    type: "individual",
    image: SERVICE_IMAGES.lunch,
    nameEn: "Ten Bis first-week lunches",
    nameHe: "תן ביס - צהריים לשבוע הראשון",
    taglineEn: "Lunch deals near Rothschild, Dizengoff, Sarona, and campus routes.",
    taglineHe: "דילים לצהריים ליד רוטשילד, דיזנגוף, שרונה וצירי קמפוס.",
    priceEn: "₪38-₪62 lunch deals",
    priceHe: "דילים לצהריים ב-38-62₪",
    dealEn: "Bundle 3 lunches and save 12%",
    dealHe: "3 ארוחות צהריים ב-12% פחות",
    etaEn: "Deals refresh around {{city}} every weekday at noon",
    etaHe: "דילים מתעדכנים ב{{city}} כל יום חול בצהריים",
    primaryAction: "individual",
  },
  {
    id: "market-basket",
    category: "food",
    type: "hybrid",
    image: SERVICE_IMAGES.groceries,
    nameEn: "Shufersal Online shared basket",
    nameHe: "שופרסל Online - סל משותף",
    taglineEn: "Coffee, milk, cleaning spray, trash bags, toilet paper, and first-week groceries.",
    taglineHe: "קפה, חלב, חומרי ניקוי, שקיות אשפה, נייר טואלט וקניות לשבוע הראשון.",
    priceEn: "₪220-₪420 shared",
    priceHe: "220-420₪ משותף",
    dealEn: "Auto-split shared staples",
    dealHe: "פיצול אוטומטי למוצרים משותפים",
    etaEn: "Same-day Shufersal delivery to {{city}}",
    etaHe: "משלוח שופרסל באותו יום ל{{city}}",
    primaryAction: "hybrid",
  },
  {
    id: "home-essentials",
    category: "setup",
    type: "team",
    image: SERVICE_IMAGES.household,
    nameEn: "ACE first-night kit",
    nameHe: "ACE - ערכת לילה ראשון",
    taglineEn: "Extension cords, shower curtain, light bulbs, basic tools, towels, and batteries.",
    taglineHe: "מפצלים, וילון אמבטיה, נורות, כלי עבודה בסיסיים, מגבות וסוללות.",
    priceEn: "₪360 shared",
    priceHe: "360₪ משותף",
    dealEn: "Delivered before key handoff",
    dealHe: "מגיע לפני קבלת המפתח",
    etaEn: "Drop-off in {{city}} by 20:00",
    etaHe: "הורדה ב{{city}} עד 20:00",
    primaryAction: "team",
  },
];

export function buildDemoServices(apartment = {}) {
  const cityKey = cityKeyFromApartment(apartment);
  const providers = PROVIDER_BLUEPRINTS.map((provider, index) => withCity(provider, cityKey, index));
  const categories = Object.entries(CATEGORY_META).map(([id, meta]) => ({
    id,
    ...meta,
    count: providers.filter((provider) => provider.category === id).length,
  }));

  return {
    cityKey,
    city: CITY_META[cityKey] || CITY_META[DEFAULT_CITY_KEY],
    providers,
    categories,
    dailyDeals: providers.filter((provider) => provider.category === "food"),
    moveInTasks: [
      { id: "keys", done: true, en: "Apartment chosen", he: "הדירה נבחרה" },
      { id: "internet", done: false, en: "Book internet setup", he: "לתאם התקנת אינטרנט" },
      { id: "move", done: false, en: "Plan move-in logistics", he: "לתכנן הובלה וכניסה" },
      { id: "first-night", done: false, en: "Cover first-night essentials", he: "לסגור ציוד ללילה הראשון" },
    ],
    expenses: [
      { id: "internet-setup", providerId: `fiber-fast-${cityKey}`, amount: 240, paidByEn: "Maya", paidByHe: "מאיה", status: "planned" },
      { id: "sofa", providerId: `room-kit-${cityKey}`, amount: 1260, paidByEn: "Noam", paidByHe: "נועם", status: "vote" },
      { id: "cleaning", providerId: `fresh-start-${cityKey}`, amount: 360, paidByEn: "You", paidByHe: "את/ה", status: "ready" },
    ],
  };
}

export function findDemoServiceProvider(apartment, providerId) {
  return buildDemoServices(apartment).providers.find((provider) => provider.id === providerId) || null;
}
