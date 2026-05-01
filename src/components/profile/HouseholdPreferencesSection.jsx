import React from "react";
import BottomSheetSelect from "@/components/shared/BottomSheetSelect";
import { HOUSEHOLD_PREFERENCE_FIELDS } from "@/lib/ruumrPlusFields";

export default function HouseholdPreferencesSection({
  values = {},
  onChange,
  disabled = false,
  className = "",
  title = "הרגלים בבית",
  description = "ככל שתהיו מדויקים יותר, Ruumr Plus ידע להתאים טוב יותר.",
}) {
  return (
    <div className={className}>
      {(title || description) && (
        <div className="mb-4 text-right">
          {title && <h3 className="text-lg font-bold text-gray-800">{title}</h3>}
          {description && <p className="text-sm text-gray-500 mt-1 leading-relaxed">{description}</p>}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {HOUSEHOLD_PREFERENCE_FIELDS.map(({ field, label, placeholder, options }) => (
          <div key={field} className="space-y-1">
            <label className="text-sm font-bold block text-right" style={{ color: "#FA3803" }}>
              {label}
            </label>
            <BottomSheetSelect
              disabled={disabled}
              value={values[field]}
              onValueChange={(nextValue) => onChange?.(field, nextValue)}
              label={label}
              placeholder={placeholder}
              options={options}
              className="bg-white"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
