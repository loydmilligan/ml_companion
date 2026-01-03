import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";

// Plugin to generate Firebase service worker with injected config
function firebaseServiceWorkerPlugin(): Plugin {
  return {
    name: "firebase-service-worker",
    writeBundle(options) {
      const outDir = options.dir || "dist";
      const swContent = `// Firebase Cloud Messaging Service Worker
// Generated at build time with Firebase config

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "${process.env.VITE_FIREBASE_API_KEY || ''}",
  authDomain: "${process.env.VITE_FIREBASE_AUTH_DOMAIN || ''}",
  projectId: "${process.env.VITE_FIREBASE_PROJECT_ID || ''}",
  messagingSenderId: "${process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || ''}",
  appId: "${process.env.VITE_FIREBASE_APP_ID || ''}"
};

// Only initialize if config is present
if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  // Handle background messages
  messaging.onBackgroundMessage((payload) => {
    console.log('[SW] Background message received:', payload);

    const notificationTitle = payload.notification?.title || 'New Notification';
    const notificationOptions = {
      body: payload.notification?.body || '',
      icon: '/favicon.png',
      badge: '/favicon.png',
      data: payload.data || {},
      tag: payload.data?.tag || 'default',
      renotify: true
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
}

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if (event.notification.data?.url) {
            client.navigate(urlToOpen);
          }
          return;
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
`;

      mkdirSync(outDir, { recursive: true });
      writeFileSync(resolve(outDir, "firebase-messaging-sw.js"), swContent);
      console.log("✓ Generated firebase-messaging-sw.js");
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), firebaseServiceWorkerPlugin()],
  server: {
    host: true,
    port: 5173,
    cors: true,
    allowedHosts: [
      "talking.mattmariani.com",
      "192.168.4.217",
    ],
  },
});
