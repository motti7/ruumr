export const HOUSEHOLD_PREFERENCE_FIELDS = [
  {
    field: "smoking_preference",
    label: "עישון בדירה",
    placeholder: "בחר/י העדפה",
    options: [
      { value: "against", label: "לא, עדיף בלי" },
      { value: "flow", label: "זורם/ת" },
      { value: "for", label: "כן, אין בעיה" },
    ],
  },
  {
    field: "pet_preference",
    label: "חיות בדירה",
    placeholder: "בחר/י העדפה",
    options: [
      { value: "against", label: "עדיף בלי" },
      { value: "flow", label: "זורם/ת" },
      { value: "for", label: "בשמחה" },
    ],
  },
  {
    field: "cleanliness",
    label: "ניקיון וסדר",
    placeholder: "בחר/י רמה",
    options: [
      { value: "1", label: "זורמ/ת עם בלגן" },
      { value: "2", label: "די נינוח/ה" },
      { value: "3", label: "מאוזן/ת" },
      { value: "4", label: "מסודר/ת" },
      { value: "5", label: "פדנט/ית" },
    ],
  },
  {
    field: "shopping",
    label: "קניות לבית",
    placeholder: "בחר/י רמה",
    options: [
      { value: "1", label: "ספונטני/ת" },
      { value: "2", label: "קצת מתכנן/ת" },
      { value: "3", label: "מאוזן/ת" },
      { value: "4", label: "אוהב/ת לתכנן" },
      { value: "5", label: "מאורגן/ת מאוד" },
    ],
  },
  {
    field: "ac_wars",
    label: "טמפרטורת מזגן",
    placeholder: "בחר/י רמה",
    options: [
      { value: "1", label: "קריר/ה" },
      { value: "2", label: "נוטה לקרירות" },
      { value: "3", label: "מאוזן/ת" },
      { value: "4", label: "נוטה לחום" },
      { value: "5", label: "חם/ה" },
    ],
  },
  {
    field: "dishes_in_sink",
    label: "כלים בכיור",
    placeholder: "בחר/י רמה",
    options: [
      { value: "1", label: "לא נורא" },
      { value: "2", label: "מדי פעם" },
      { value: "3", label: "מאוזן/ת" },
      { value: "4", label: "מעדיף/ה לשטוף מהר" },
      { value: "5", label: "מיד אחרי" },
    ],
  },
  {
    field: "friends_and_parties",
    label: "חברים ומסיבות",
    placeholder: "בחר/י רמה",
    options: [
      { value: "1", label: "שקט/ה בבית" },
      { value: "2", label: "חברים פה ושם" },
      { value: "3", label: "מאוזן/ת" },
      { value: "4", label: "אוהב/ת אירוח" },
      { value: "5", label: "מסיבות ואירוחים" },
    ],
  },
];

export const HOUSEHOLD_PREFERENCE_DEFAULTS = {
  smoking_preference: "flow",
  pet_preference: "flow",
  cleanliness: "3",
  shopping: "3",
  ac_wars: "3",
  dishes_in_sink: "3",
  friends_and_parties: "3",
};

export const HOUSEHOLD_PREFERENCE_FIELDS_BY_KEY = HOUSEHOLD_PREFERENCE_FIELDS.reduce((acc, field) => {
  acc[field.field] = field;
  return acc;
}, {});

export function getHouseholdPreferenceLabel(fieldName, value) {
  if (value == null || value === "") {
    return "-";
  }

  const field = HOUSEHOLD_PREFERENCE_FIELDS_BY_KEY[fieldName];
  if (!field) {
    return String(value);
  }

  const match = field.options.find((option) => String(option.value) === String(value));
  return match?.label ?? String(value);
}

export function hasHouseholdPreferenceValues(profile = {}) {
  return HOUSEHOLD_PREFERENCE_FIELDS.some(({ field }) => profile[field] != null && profile[field] !== "");
}
