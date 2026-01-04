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

// Check if push notifications are supported
function checkSupport(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window &&
    isFirebaseConfigured
  );
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
      const isSupported = checkSupport();
      const permission = isSupported ? Notification.permission : "unsupported";

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
    if (checkSupport() && messaging) {
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

      // Check if there's already a service worker
      let registration = await navigator.serviceWorker.getRegistration();
      console.log("[FCM] Existing registration:", registration?.scope);

      if (!registration) {
        // Try to register it ourselves
        console.log("[FCM] No registration found, registering sw.js...");
        setState((prev) => ({ ...prev, debugStatus: "Registering service worker..." }));
        try {
          registration = await navigator.serviceWorker.register("/sw.js");
          console.log("[FCM] Registered, waiting for active...");
        } catch (regError) {
          console.error("[FCM] Registration failed:", regError);
          throw new Error(`Service worker registration failed: ${regError}`);
        }
      }

      // Wait for it to be ready with timeout
      const swReadyPromise = navigator.serviceWorker.ready;
      const swTimeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Service worker ready timed out after 10s")), 10000)
      );

      try {
        registration = await Promise.race([swReadyPromise, swTimeoutPromise]);
      } catch (e) {
        console.error("[FCM] Service worker ready timeout:", e);
        throw new Error("Service worker not ready - try refreshing the page");
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
