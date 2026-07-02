import aceLogo from "@/assets/brand-logos/ace.png";
import bezeqLogo from "@/assets/brand-logos/bezeq.png";
import ikeaLogo from "@/assets/brand-logos/ikea.png";

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
    bodyEn: "Internet, utilities, keys, and first-week basics.",
    bodyHe: "אינטרנט, תשתיות, מפתחות ודברים שחייבים בשבוע הראשון.",
  },
  moving: {
    icon: "truck",
    en: "Moving & packing",
    he: "הובלה ומשלוחים",
    bodyEn: "Movers, boxes, packing gear, and pickup routes.",
    bodyHe: "מובילים, ארגזים, ציוד אריזה ומסלולי איסוף.",
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
  repairs: {
    icon: "wrench",
    en: "Repairs & safety",
    he: "תיקונים ובטיחות",
    bodyEn: "Locksmith, small fixes, shelves, curtains, and safety checks.",
    bodyHe: "מנעולן, תיקונים קטנים, מדפים, וילונות ובדיקות בטיחות.",
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
  supplies: aceLogo,
  utilities: brandImage({
    background: "#fff7ed",
    foreground: "#9a3412",
    accent: "#fb923c",
    brand: "Utility",
    subtitle: "Handoff desk",
    motif: "house",
  }),
  locksmith: brandImage({
    background: "#ecfdf5",
    foreground: "#065f46",
    accent: "#34d399",
    brand: "KeySafe",
    subtitle: "Locks & keys",
  }),
  handyman: brandImage({
    background: "#f8fafc",
    foreground: "#334155",
    accent: "#fb923c",
    brand: "FixMate",
    subtitle: "Small repairs",
    motif: "house",
  }),
  cleaning: brandImage({
    background: "#123c69",
    foreground: "#ffffff",
    accent: "#4dd8c8",
    brand: "Spetz",
    subtitle: "Move-in cleaning",
  }),
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
    id: "packing-supplies",
    category: "moving",
    type: "hybrid",
    image: SERVICE_IMAGES.supplies,
    nameEn: "Box & packing kit",
    nameHe: "ערכת אריזה וקרטונים",
    taglineEn: "Boxes, tape, markers, mattress covers, and fragile-item wrap delivered before packing day.",
    taglineHe: "קרטונים, מסקינג טייפ, טושים, כיסוי למזרן וניילון לפיצ'פקעס שבירים לפני יום האריזה.",
    priceEn: "from ₪180 shared",
    priceHe: "החל מ-180₪ משותף",
    dealEn: "Enough boxes for 3 roommates",
    dealHe: "מספיק קרטונים ל-3 שותפים",
    etaEn: "Packing gear drop-off near {{city}}: tomorrow",
    etaHe: "הורדת ציוד אריזה ב{{city}}: מחר",
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
    id: "utility-handoff",
    category: "setup",
    type: "hybrid",
    image: SERVICE_IMAGES.utilities,
    nameEn: "Utilities handoff desk",
    nameHe: "מוקד העברת חשבונות",
    taglineEn: "Electricity, water, gas, arnona, and building committee setup checklist for the new lease.",
    taglineHe: "צ'קליסט להעברת חשמל, מים, גז, ארנונה וועד בית לחוזה החדש.",
    priceEn: "free setup checklist",
    priceHe: "צ'קליסט חינמי",
    dealEn: "One owner per account",
    dealHe: "אחראי/ת אחד לכל חשבון",
    etaEn: "Account handoff tasks for {{city}} ready now",
    etaHe: "משימות העברת חשבונות ב{{city}} מוכנות עכשיו",
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
  {
    id: "key-safe",
    category: "repairs",
    type: "team",
    image: SERVICE_IMAGES.locksmith,
    nameEn: "Locksmith & spare keys",
    nameHe: "מנעולן ושכפול מפתחות",
    taglineEn: "Cylinder check, mailbox key copy, extra apartment keys, and door alignment before move-in.",
    taglineHe: "בדיקת צילינדר, שכפול מפתח תיבה, מפתחות נוספים וכיוון דלת לפני כניסה.",
    priceEn: "from ₪220",
    priceHe: "החל מ-220₪",
    dealEn: "3 spare keys included",
    dealHe: "כולל 3 מפתחות ספייר",
    etaEn: "Locksmith near {{city}}: next morning",
    etaHe: "מנעולן ליד {{city}}: מחר בבוקר",
    primaryAction: "team",
  },
  {
    id: "fix-mate",
    category: "repairs",
    type: "hybrid",
    image: SERVICE_IMAGES.handyman,
    nameEn: "Handyman move-in fixes",
    nameHe: "הנדימן לתיקוני כניסה",
    taglineEn: "Curtain rods, shelves, picture hooks, loose handles, shower head, and minor wall fixes.",
    taglineHe: "מוטות וילון, מדפים, תליית תמונות, ידיות רופפות, ראש מקלחת ותיקוני קיר קטנים.",
    priceEn: "₪180-₪420 visit",
    priceHe: "180-420₪ לביקור",
    dealEn: "Bundle small fixes in one visit",
    dealHe: "ריכוז תיקונים קטנים בביקור אחד",
    etaEn: "Handyman slot near {{city}}: 48 hours",
    etaHe: "חלון הנדימן ליד {{city}}: 48 שעות",
    primaryAction: "hybrid",
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
    moveInTasks: [
      { id: "keys", done: true, en: "Apartment chosen", he: "הדירה נבחרה" },
      { id: "handoff", done: false, en: "Schedule key handoff and meter photos", he: "לתאם מסירת מפתח וצילום מונים" },
      { id: "internet", done: false, en: "Book internet installation", he: "לתאם התקנת אינטרנט" },
      { id: "move", done: false, en: "Book movers or shipping route", he: "להזמין הובלה או משלוח ציוד" },
      { id: "packing", done: false, en: "Order boxes and packing equipment", he: "להזמין קרטונים וציוד אריזה" },
      { id: "cleaning", done: false, en: "Schedule deep clean before move-in", he: "לתאם ניקיון יסודי לפני כניסה" },
      { id: "utilities", done: false, en: "Assign electricity, water, gas, and arnona owners", he: "לחלק אחריות על חשמל, מים, גז וארנונה" },
      { id: "repairs", done: false, en: "Check locks, keys, and small repairs", he: "לבדוק מנעולים, מפתחות ותיקונים קטנים" },
    ],
    expenses: [
      { id: "internet-setup", providerId: `fiber-fast-${cityKey}`, amount: 240, paidByEn: "Maya", paidByHe: "מאיה", status: "planned" },
      { id: "packing-kit", providerId: `packing-supplies-${cityKey}`, amount: 180, paidByEn: "Eitan", paidByHe: "איתן", status: "planned" },
      { id: "sofa", providerId: `room-kit-${cityKey}`, amount: 1260, paidByEn: "Noam", paidByHe: "נועם", status: "vote" },
      { id: "cleaning", providerId: `fresh-start-${cityKey}`, amount: 360, paidByEn: "You", paidByHe: "את/ה", status: "ready" },
      { id: "keys", providerId: `key-safe-${cityKey}`, amount: 260, paidByEn: "Maya", paidByHe: "מאיה", status: "planned" },
    ],
  };
}

export function findDemoServiceProvider(apartment, providerId) {
  return buildDemoServices(apartment).providers.find((provider) => provider.id === providerId) || null;
}
