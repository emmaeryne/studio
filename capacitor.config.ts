import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.liaisonlegale.app',
  appName: 'Liaison Légale',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
};

export default config;
