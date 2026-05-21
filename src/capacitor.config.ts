import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.base68c919adff6ac6fafb51bed6.app',
  appName: 'Ruumr',
  webDir: 'dist',
  ios: {
    contentInset: 'automatic',
    handleApplicationNotifications: false,
  },
  plugins: {
    StatusBar: {
      style: 'dark',
      backgroundColor: '#E8420A',
    },
  },
};

export default config;
