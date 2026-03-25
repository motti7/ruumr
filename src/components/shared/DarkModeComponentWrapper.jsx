/**
 * DarkModeComponentWrapper — HOC for third-party UI components (charts, graphs, etc.)
 * Automatically injects CSS class names based on current dark/light mode state.
 * Ensures perfect theming consistency across all third-party components.
 */

import React, { useState, useEffect } from 'react';

export default function DarkModeComponentWrapper({
  Component,
  isDarkMode = false,
  classNameLight = '',
  classNameDark = '',
  themeOverrides = {}, // { selector: { property: lightValue, darkValue } }
  ...props
}) {
  const [isCurrentlyDark, setIsCurrentlyDark] = useState(isDarkMode);
  const [injectedStyles, setInjectedStyles] = useState(null);

  // Detect and monitor dark mode
  useEffect(() => {
    const updateDarkMode = () => {
      const isDark =
        document.documentElement.classList.contains('dark') ||
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsCurrentlyDark(isDark);
    };

    updateDarkMode();

    // Listen for changes to html class
    const observer = new MutationObserver(updateDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateDarkMode);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', updateDarkMode);
    };
  }, []);

  // Generate and inject dynamic CSS for theme overrides
  useEffect(() => {
    if (!themeOverrides || Object.keys(themeOverrides).length === 0) {
      return;
    }

    let styleContent = '';

    Object.entries(themeOverrides).forEach(([selector, properties]) => {
      if (isCurrentlyDark) {
        // Dark mode styles
        styleContent += `\n.dark ${selector} {\n`;
        Object.entries(properties).forEach(([prop, values]) => {
          const darkValue = typeof values === 'object' ? values.dark : values;
          styleContent += `  ${prop}: ${darkValue};\n`;
        });
        styleContent += `}\n`;
      } else {
        // Light mode styles
        styleContent += `\n${selector} {\n`;
        Object.entries(properties).forEach(([prop, values]) => {
          const lightValue = typeof values === 'object' ? values.light : values;
          styleContent += `  ${prop}: ${lightValue};\n`;
        });
        styleContent += `}\n`;
      }
    });

    if (styleContent) {
      setInjectedStyles(styleContent);
    }
  }, [isCurrentlyDark, themeOverrides]);

  const wrapperClassName = `
    ${isCurrentlyDark ? classNameDark : classNameLight}
  `.trim();

  return (
    <>
      {injectedStyles && <style>{injectedStyles}</style>}
      <div
        className={wrapperClassName}
        data-theme-mode={isCurrentlyDark ? 'dark' : 'light'}
      >
        <Component
          {...props}
          className={`${props.className || ''} ${wrapperClassName}`.trim()}
        />
      </div>
    </>
  );
}

/**
 * Higher-order component factory for wrapping components with dark mode support
 * Usage:
 *   const DarkModeChart = withDarkMode(Chart, {
 *     classNameLight: 'bg-white text-gray-900',
 *     classNameDark: 'bg-gray-900 text-white',
 *     themeOverrides: {
 *       '.recharts-surface': {
 *         fill: { light: '#ffffff', dark: '#1a1a1a' }
 *       }
 *     }
 *   });
 */
export function withDarkMode(
  Component,
  {
    classNameLight = '',
    classNameDark = '',
    themeOverrides = {},
    displayName = Component.displayName || Component.name || 'Component',
  } = {}
) {
  const WrappedComponent = (props) => (
    <DarkModeComponentWrapper
      Component={Component}
      classNameLight={classNameLight}
      classNameDark={classNameDark}
      themeOverrides={themeOverrides}
      {...props}
    />
  );

  WrappedComponent.displayName = `withDarkMode(${displayName})`;
  return WrappedComponent;
}

/**
 * Helper to generate Recharts dark-mode theme overrides
 * Usage:
 *   const rechartsTheme = generateRechartsTheme({
 *     lightBg: '#ffffff',
 *     darkBg: '#1a1a1a',
 *     lightText: '#333333',
 *     darkText: '#ffffff'
 *   });
 */
export function generateRechartsTheme({
  lightBg = '#ffffff',
  darkBg = '#1a1a1a',
  lightText = '#333333',
  darkText = '#ffffff',
  lightGrid = '#e5e7eb',
  darkGrid = '#333333',
} = {}) {
  return {
    '.recharts-surface': {
      backgroundColor: { light: lightBg, dark: darkBg },
    },
    '.recharts-text': {
      fill: { light: lightText, dark: darkText },
    },
    '.recharts-cartesian-axis-tick-value': {
      fill: { light: lightText, dark: darkText },
    },
    '.recharts-cartesian-axis-line': {
      stroke: { light: lightGrid, dark: darkGrid },
    },
    '.recharts-cartesian-grid-horizontal line': {
      stroke: { light: lightGrid, dark: darkGrid },
    },
    '.recharts-cartesian-grid-vertical line': {
      stroke: { light: lightGrid, dark: darkGrid },
    },
    '.recharts-reference-line': {
      stroke: { light: lightGrid, dark: darkGrid },
    },
    '.recharts-legend-wrapper': {
      color: { light: lightText, dark: darkText },
    },
  };
}