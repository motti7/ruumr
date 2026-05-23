import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ruumr.app',
  appName: 'Ruumr',
  webDir: 'dist',
  server: {
    allowNavigation: ['app.ruumrapp.com', 'app.base44.com'],
  },
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
