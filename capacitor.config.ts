import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.liaisonlegale.app',
  appName: 'Liaison Légale',
  webDir: '.next',
  server: {
    androidScheme: 'https',
    // Si vous déployez votre application sur un serveur, mettez l'URL ici.
    // Pour les tests locaux, cela n'est pas nécessaire.
    // url: 'http://192.168.1.10:3000'
  }
};

export default config;
