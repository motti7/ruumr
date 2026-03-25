import React from 'react';
import BottomSheetSelect from './BottomSheetSelect';

/**
 * Universal wrapper for all select-like controls.
 * Ensures every select field uses BottomSheetSelect for consistency.
 * Fallback for any native <select> elements found in the codebase.
 */
export default function SelectFieldWrapper({
  value,
  onValueChange,
  options = [],
  label,
  placeholder,
  disabled = false,
  className = '',
  ...props
}) {
  return (
    <BottomSheetSelect
      value={value}
      onValueChange={onValueChange}
      label={label || 'Select'}
      placeholder={placeholder || 'Choose an option'}
      options={options}
      disabled={disabled}
      className={className}
      {...props}
    />
  );
}