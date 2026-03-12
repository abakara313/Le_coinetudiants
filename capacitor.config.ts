import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'fr.lecoindesetudiants',
  appName: 'Le Coin des Étudiants',
  webDir: 'dist',

  // Paramètres Android
  android: {
    // Autorise les requêtes HTTP en clair (Supabase utilise HTTPS donc OK,
    // mais nécessaire pour éviter les blocages sur certains appareils)
    allowMixedContent: false,
    // Taille minimale de la WebView
    minWebViewVersion: 60,
  },

  // Permet à l'app d'appeler votre backend Supabase depuis le mobile
  server: {
    // En développement, pointez vers votre IP locale pour tester en live :
    // url: 'http://192.168.X.X:5173',
    // cleartext: true,

    // En production (APK final) : laisser commenté → l'app utilise les fichiers dist/
    androidScheme: 'https', // évite les problèmes de cookies/auth sur Android
  },

  plugins: {
    // Si vous utilisez des plugins Capacitor natifs plus tard (camera, push notif...)
    // configurez-les ici
  },
};

export default config;