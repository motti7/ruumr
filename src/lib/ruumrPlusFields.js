// Display strings carry both a Hebrew `label` (the original value, kept as a
// fallback) and a `labelKey`/`placeholderKey` pointing at the i18n catalog so
// React consumers can render translated text via t(...). The `value` codes
// ("against"/"flow"/"for", "1".."5") are stable identifiers used for storage
// and lookup and are intentionally NOT translated.
export const HOUSEHOLD_PREFERENCE_FIELDS = [
  {
    field: "smoking_preference",
    label: "עישון בדירה",
    labelKey: "hp_smoking_label",
    placeholder: "בחר/י העדפה",
    placeholderKey: "hp_placeholder_preference",
    options: [
      { value: "against", label: "לא, עדיף בלי", labelKey: "hp_smoking_against" },
      { value: "flow", label: "זורם/ת", labelKey: "hp_smoking_flow" },
      { value: "for", label: "כן, אין בעיה", labelKey: "hp_smoking_for" },
    ],
  },
  {
    field: "pet_preference",
    label: "חיות בדירה",
    labelKey: "hp_pet_label",
    placeholder: "בחר/י העדפה",
    placeholderKey: "hp_placeholder_preference",
    options: [
      { value: "against", label: "עדיף בלי", labelKey: "hp_pet_against" },
      { value: "flow", label: "זורם/ת", labelKey: "hp_pet_flow" },
      { value: "for", label: "בשמחה", labelKey: "hp_pet_for" },
    ],
  },
  {
    field: "cleanliness",
    label: "ניקיון וסדר",
    labelKey: "hp_cleanliness_label",
    placeholder: "בחר/י רמה",
    placeholderKey: "hp_placeholder_level",
    options: [
      { value: "1", label: "זורמ/ת עם בלגן", labelKey: "hp_cleanliness_1" },
      { value: "2", label: "די נינוח/ה", labelKey: "hp_cleanliness_2" },
      { value: "3", label: "מאוזן/ת", labelKey: "hp_cleanliness_3" },
      { value: "4", label: "מסודר/ת", labelKey: "hp_cleanliness_4" },
      { value: "5", label: "פדנט/ית", labelKey: "hp_cleanliness_5" },
    ],
  },
  {
    field: "shopping",
    label: "קניות לבית",
    labelKey: "hp_shopping_label",
    placeholder: "בחר/י רמה",
    placeholderKey: "hp_placeholder_level",
    options: [
      { value: "1", label: "ספונטני/ת", labelKey: "hp_shopping_1" },
      { value: "2", label: "קצת מתכנן/ת", labelKey: "hp_shopping_2" },
      { value: "3", label: "מאוזן/ת", labelKey: "hp_shopping_3" },
      { value: "4", label: "אוהב/ת לתכנן", labelKey: "hp_shopping_4" },
      { value: "5", label: "מאורגן/ת מאוד", labelKey: "hp_shopping_5" },
    ],
  },
  {
    field: "ac_wars",
    label: "טמפרטורת מזגן",
    labelKey: "hp_ac_label",
    placeholder: "בחר/י רמה",
    placeholderKey: "hp_placeholder_level",
    options: [
      { value: "1", label: "קריר/ה", labelKey: "hp_ac_1" },
      { value: "2", label: "נוטה לקרירות", labelKey: "hp_ac_2" },
      { value: "3", label: "מאוזן/ת", labelKey: "hp_ac_3" },
      { value: "4", label: "נוטה לחום", labelKey: "hp_ac_4" },
      { value: "5", label: "חם/ה", labelKey: "hp_ac_5" },
    ],
  },
  {
    field: "dishes_in_sink",
    label: "כלים בכיור",
    labelKey: "hp_dishes_label",
    placeholder: "בחר/י רמה",
    placeholderKey: "hp_placeholder_level",
    options: [
      { value: "1", label: "לא נורא", labelKey: "hp_dishes_1" },
      { value: "2", label: "מדי פעם", labelKey: "hp_dishes_2" },
      { value: "3", label: "מאוזן/ת", labelKey: "hp_dishes_3" },
      { value: "4", label: "מעדיף/ה לשטוף מהר", labelKey: "hp_dishes_4" },
      { value: "5", label: "מיד אחרי", labelKey: "hp_dishes_5" },
    ],
  },
  {
    field: "friends_and_parties",
    label: "חברים ומסיבות",
    labelKey: "hp_friends_label",
    placeholder: "בחר/י רמה",
    placeholderKey: "hp_placeholder_level",
    options: [
      { value: "1", label: "שקט/ה בבית", labelKey: "hp_friends_1" },
      { value: "2", label: "חברים פה ושם", labelKey: "hp_friends_2" },
      { value: "3", label: "מאוזן/ת", labelKey: "hp_friends_3" },
      { value: "4", label: "אוהב/ת אירוח", labelKey: "hp_friends_4" },
      { value: "5", label: "מסיבות ואירוחים", labelKey: "hp_friends_5" },
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

// Returns the i18n catalog key for a field's selected option, or null if the
// field/value is unknown (callers fall back to getHouseholdPreferenceLabel).
export function getHouseholdPreferenceLabelKey(fieldName, value) {
  if (value == null || value === "") {
    return null;
  }

  const field = HOUSEHOLD_PREFERENCE_FIELDS_BY_KEY[fieldName];
  if (!field) {
    return null;
  }

  const match = field.options.find((option) => String(option.value) === String(value));
  return match?.labelKey ?? null;
}

export function hasHouseholdPreferenceValues(profile = {}) {
  return HOUSEHOLD_PREFERENCE_FIELDS.some(({ field }) => profile[field] != null && profile[field] !== "");
}
