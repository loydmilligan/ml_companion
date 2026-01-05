import { useState, useEffect, useCallback } from "react";
import { messaging, getToken, onMessage, vapidKey, isFirebaseConfigured } from "../lib/firebase";
import { supabase } from "../lib/supabase";

interface PushNotificationState {
  isSupported: boolean;
  isEnabled: boolean;
  isLoading: boolean;
  error: string | null;
  permission: NotificationPermission | "unsupported";
  debugStatus: string | null;
}

interface UsePushNotificationsReturn extends PushNotificationState {
  requestPermission: () => Promise<boolean>;
  unregister: () => Promise<void>;
}

// Detect platform
function getPlatform(): "web" | "ios" | "android" {
  const ua = navigator.userAgent.toLowerCase();
  if (/android/.test(ua)) return "android";
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  return "web";
}

// Check if push notifications are supported with detailed logging
function checkSupport(): { supported: boolean; reason?: string } {
  const checks = {
    window: typeof window !== "undefined",
    serviceWorker: "serviceWorker" in navigator,
    pushManager: "PushManager" in window,
    notification: "Notification" in window,
    firebaseConfigured: isFirebaseConfigured,
  };

  console.log("[FCM] Support checks:", checks);

  if (!checks.window) return { supported: false, reason: "No window object" };
  if (!checks.serviceWorker) return { supported: false, reason: "ServiceWorker not supported" };
  if (!checks.pushManager) return { supported: false, reason: "PushManager not supported" };
  if (!checks.notification) return { supported: false, reason: "Notification API not supported" };
  if (!checks.firebaseConfigured) return { supported: false, reason: "Firebase not configured" };

  return { supported: true };
}

// Wait for service worker to become active
async function waitForActiveServiceWorker(timeoutMs: number = 10000): Promise<ServiceWorkerRegistration> {
  console.log("[FCM] Waiting for active service worker...");
  console.log("[FCM] Current controller:", !!navigator.serviceWorker.controller);

  // If there's already a controller, the page is controlled by an active SW
  // Just wait for ready() which should resolve immediately
  if (navigator.serviceWorker.controller) {
    console.log("[FCM] Page has controller, waiting for ready...");
    const registration = await navigator.serviceWorker.ready;
    console.log("[FCM] Ready resolved, scope:", registration.scope);
    return registration;
  }

  // No controller yet - either first visit or SW was just installed
  // Try to get the registration
  let registration = await navigator.serviceWorker.getRegistration("/");
  console.log("[FCM] Registration:", registration?.scope, "active:", !!registration?.active);

  // If no registration exists, register the SW
  if (!registration) {
    console.log("[FCM] No registration, registering /sw.js...");
    registration = await navigator.serviceWorker.register("/sw.js");
    console.log("[FCM] Registered, scope:", registration.scope);
  }

  // If there's an active worker in the registration, use it
  if (registration.active) {
    console.log("[FCM] Registration has active worker");
    return registration;
  }

  // Otherwise wait for ready() with timeout
  // ready() resolves when there's an active SW, even if page isn't controlled yet
  console.log("[FCM] Waiting for ready() with timeout...");

  const readyPromise = navigator.serviceWorker.ready;
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Service worker activation timed out")), timeoutMs)
  );

  return Promise.race([readyPromise, timeoutPromise]);
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isEnabled: false,
    isLoading: true,
    error: null,
    permission: "unsupported",
    debugStatus: null,
  });

  // Initialize state - check if we have a token saved, not just permission
  useEffect(() => {
    const init = async () => {
      const supportCheck = checkSupport();
      const isSupported = supportCheck.supported;
      const permission = isSupported ? Notification.permission : "unsupported";

      if (!isSupported) {
        console.log("[FCM] Push not supported:", supportCheck.reason);
      }

      // Don't assume enabled just because permission is granted
      // We need to verify a token exists in the database
      let hasToken = false;
      if (permission === "granted") {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: tokens } = await supabase
              .from("push_tokens")
              .select("id")
              .eq("user_id", user.id)
              .limit(1);
            hasToken = (tokens?.length ?? 0) > 0;
          }
        } catch (e) {
          console.error("[FCM] Error checking token:", e);
        }
      }

      setState((prev) => ({
        ...prev,
        isSupported,
        permission,
        isEnabled: hasToken,
        isLoading: false,
      }));
    };

    init();

    // Set up foreground message listener
    if (checkSupport().supported && messaging) {
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log("[FCM] Foreground message received:", payload);

        // Show a toast or in-app notification
        if (payload.notification) {
          new Notification(payload.notification.title || "New Notification", {
            body: payload.notification.body,
            icon: "/favicon.png",
          });
        }
      });

      return () => unsubscribe();
    }
  }, []);

  // Request permission and register token
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported || !messaging) {
      setState((prev) => ({
        ...prev,
        error: "Push notifications are not supported on this device/browser",
      }));
      return false;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null, debugStatus: "Starting..." }));

    try {
      console.log("[FCM] Starting push notification setup...");
      console.log("[FCM] vapidKey present:", !!vapidKey);

      setState((prev) => ({ ...prev, debugStatus: "Requesting permission..." }));
      // Request permission
      const permission = await Notification.requestPermission();
      console.log("[FCM] Permission result:", permission);

      if (permission !== "granted") {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          permission,
          isEnabled: false,
          error: permission === "denied" ? "Notifications were blocked" : null,
        }));
        return false;
      }

      // Wait for the service worker with timeout
      setState((prev) => ({ ...prev, debugStatus: "Waiting for service worker..." }));
      console.log("[FCM] Waiting for service worker...");

      let registration: ServiceWorkerRegistration;
      try {
        registration = await waitForActiveServiceWorker(10000);
      } catch (e) {
        console.error("[FCM] Service worker error:", e);
        throw e instanceof Error ? e : new Error("Service worker not ready");
      }

      console.log("[FCM] Service worker ready, scope:", registration.scope);

      // Get FCM token with timeout
      setState((prev) => ({ ...prev, debugStatus: "Getting FCM token..." }));
      console.log("[FCM] Getting FCM token...");
      const tokenPromise = getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration,
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("FCM token request timed out after 30s")), 30000)
      );

      const token = await Promise.race([tokenPromise, timeoutPromise]);
      console.log("[FCM] Got token:", token ? token.substring(0, 20) + "..." : "null");

      if (!token) {
        throw new Error("Failed to get FCM token - token was empty");
      }

      // Save token to Supabase
      setState((prev) => ({ ...prev, debugStatus: "Got token, authenticating..." }));
      console.log("[FCM] Getting authenticated user...");
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        throw new Error(`Auth error: ${userError.message}`);
      }
      if (!user) {
        throw new Error("User not authenticated");
      }
      console.log("[FCM] User ID:", user.id);

      const platform = getPlatform();
      console.log("[FCM] Platform detected:", platform);

      const deviceInfo = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
      };

      // Upsert token (update if exists, insert if new)
      setState((prev) => ({ ...prev, debugStatus: "Saving to database..." }));
      console.log("[FCM] Saving token to database...");
      const { data: upsertData, error: upsertError } = await supabase
        .from("push_tokens")
        .upsert(
          {
            user_id: user.id,
            token,
            platform,
            device_info: deviceInfo,
            last_used_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id,token",
          }
        )
        .select();

      console.log("[FCM] Upsert result:", { data: upsertData, error: upsertError });

      if (upsertError) {
        console.error("Failed to save push token:", upsertError);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isEnabled: false,
          permission: "granted",
          error: `Failed to save token: ${upsertError.message}`,
        }));
        return false;
      }

      setState((prev) => ({
        ...prev,
        isLoading: false,
        isEnabled: true,
        permission: "granted",
        error: null,
        debugStatus: "Success! Token saved.",
      }));

      console.log("[FCM] Push notifications enabled, token:", token.substring(0, 20) + "...");
      return true;
    } catch (error) {
      console.error("[FCM] Error enabling push notifications:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to enable notifications",
      }));
      return false;
    }
  }, [state.isSupported]);

  // Unregister push notifications
  const unregister = useCallback(async (): Promise<void> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Remove all tokens for this user on this device
        // We can't easily get the current token without requesting permission again,
        // so we'll just mark as disabled in the UI
        await supabase
          .from("push_tokens")
          .delete()
          .eq("user_id", user.id);
      }

      setState((prev) => ({
        ...prev,
        isLoading: false,
        isEnabled: false,
      }));
    } catch (error) {
      console.error("[FCM] Error unregistering:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to unregister",
      }));
    }
  }, []);

  return {
    ...state,
    requestPermission,
    unregister,
  };
}
