import React from "react";
import { useTranslation } from "react-i18next";
import BottomSheetSelect from "@/components/shared/BottomSheetSelect";
import { HOUSEHOLD_PREFERENCE_FIELDS } from "@/lib/ruumrPlusFields";

export default function HouseholdPreferencesSection({
  values = {},
  onChange,
  disabled = false,
  className = "",
  title,
  description,
}) {
  const { t } = useTranslation();
  const finalTitle = title === undefined ? t("home_habits") : title;
  const finalDescription = description === undefined ? t("home_habits_desc_accurate") : description;
  return (
    <div className={className}>
      {(finalTitle || finalDescription) && (
        <div className="mb-4 text-start">
          {finalTitle && <h3 className="text-lg font-bold text-gray-800">{finalTitle}</h3>}
          {finalDescription && <p className="text-sm text-gray-500 mt-1 leading-relaxed">{finalDescription}</p>}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {HOUSEHOLD_PREFERENCE_FIELDS.map((f) => {
          const fieldLabel = f.labelKey ? t(f.labelKey) : f.label;
          return (
          <div key={f.field} className="space-y-1">
            <label className="text-sm font-bold block text-start" style={{ color: "#FA3803" }}>
              {fieldLabel}
            </label>
            <BottomSheetSelect
              disabled={disabled}
              value={values[f.field]}
              onValueChange={(nextValue) => onChange?.(f.field, nextValue)}
              label={fieldLabel}
              placeholder={f.placeholderKey ? t(f.placeholderKey) : f.placeholder}
              options={f.options.map((o) => ({ ...o, label: o.labelKey ? t(o.labelKey) : o.label }))}
              className="bg-white"
            />
          </div>
          );
        })}
      </div>
    </div>
  );
}
