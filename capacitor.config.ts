import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.liaisonlegale.app',
  appName: 'Liaison Légale',
  webDir: 'public', // On pointe vers un dossier qui existe, même si on ne l'utilisera pas en développement
  server: {
    // Pour le développement, vous devez lancer `npm run dev`
    // et utiliser cette URL dans l'application Android.
    // Remplacez 192.168.1.XX par l'adresse IP de votre ordinateur sur le réseau local.
    url: 'http://192.168.1.13:9002', 
    cleartext: true,
  }
};

export default config;
