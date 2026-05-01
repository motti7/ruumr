import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ruumr.app.android',
  appName: 'Ruumr',
  webDir: 'dist',
  bundledWebRuntime: false,
  plugins: {
    StatusBar: {
      style: 'dark',
      backgroundColor: '#E8420A',
    },
  },
};

export default config;
