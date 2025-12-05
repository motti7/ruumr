import React, { useState } from 'react';

const TinderSwitch = ({ defaultChecked = false, onChange, className = "" }) => {
  const [isChecked, setIsChecked] = useState(defaultChecked);

  const handleToggle = () => {
    const newValue = !isChecked;
    setIsChecked(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <div className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={handleToggle}
        className="relative w-14 h-8 rounded-full transition-colors duration-200 focus:outline-none overflow-hidden"
        style={{ backgroundColor: isChecked ? '#FF5722' : '#E5E7EB' }}
      >
        <span className="sr-only">Toggle switch</span>
        <div 
          className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-200"
          style={{ 
            left: isChecked ? 'calc(100% - 28px)' : '4px'
          }}
        />
      </button>
    </div>
  );
};

export default TinderSwitch;