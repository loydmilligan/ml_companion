import { initializeApp, FirebaseApp } from "firebase/app";
import { getMessaging, Messaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

// Check if Firebase is configured
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && vapidKey
);

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

// Initialize Firebase only if configured
if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    // Only get messaging if we're in a browser that supports it
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      messaging = getMessaging(app);
    }
  } catch (error) {
    console.error("Failed to initialize Firebase:", error);
  }
}

export { app, messaging, getToken, onMessage, vapidKey };
