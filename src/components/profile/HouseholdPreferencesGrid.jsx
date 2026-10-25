import React from "react";
import { useTranslation } from "react-i18next";
import { HOUSEHOLD_PREFERENCE_FIELDS } from "@/lib/householdPreferenceFields";

export default function HouseholdPreferencesGrid({
  profile = {},
  className = "",
  variant = "light",
  title,
  description = null,
}) {
  const { t } = useTranslation();
  const finalTitle = title === undefined ? t("home_habits") : title;
  const profileData = /** @type {Record<string, any>} */ (profile);
  const hasAnyValue = HOUSEHOLD_PREFERENCE_FIELDS.some(({ field }) => profileData[field] != null && profileData[field] !== "");

  if (!hasAnyValue) {
    return null;
  }

  const containerClassName = variant === "dark"
    ? "bg-white/10 backdrop-blur-sm border border-white/10"
    : "bg-white border border-gray-100 shadow-sm";

  const cardClassName = variant === "dark"
    ? "bg-white/10 border border-white/10 text-white"
    : "bg-gray-50 border border-gray-100 text-gray-800";

  const labelClassName = variant === "dark" ? "text-white/70" : "text-gray-500";
  const valueClassName = variant === "dark" ? "text-white" : "text-gray-900";

  const getLabel = (fieldName, value) => {
    if (value == null || value === "") {
      return "-";
    }

    const field = HOUSEHOLD_PREFERENCE_FIELDS.find((item) => item.field === fieldName);
    const match = field?.options.find((option) => String(option.value) === String(value));
    if (!match) return String(value);
    return match.labelKey ? t(match.labelKey) : (match.label ?? String(value));
  };

  return (
    <div className={`${containerClassName} rounded-2xl p-4 ${className}`}>
      {(finalTitle || description) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="text-start">
            {finalTitle && <h4 className={`font-bold text-lg ${variant === "dark" ? "text-white" : "text-gray-900"}`}>{finalTitle}</h4>}
            {description && <p className={`text-sm mt-1 ${variant === "dark" ? "text-white/70" : "text-gray-500"}`}>{description}</p>}
          </div>

        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {HOUSEHOLD_PREFERENCE_FIELDS.map((f) => (
          <div key={f.field} className={`rounded-xl p-3 ${cardClassName}`}>
            <span className={`text-xs font-medium block mb-1 ${labelClassName}`}>{f.labelKey ? t(f.labelKey) : f.label}</span>
            <span className={`font-bold ${valueClassName}`}>{getLabel(f.field, profileData[f.field])}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
