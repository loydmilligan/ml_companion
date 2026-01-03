import { useState, useEffect, useCallback } from "react";
import { messaging, getToken, onMessage, vapidKey, isFirebaseConfigured } from "../lib/firebase";
import { supabase } from "../lib/supabase";

interface PushNotificationState {
  isSupported: boolean;
  isEnabled: boolean;
  isLoading: boolean;
  error: string | null;
  permission: NotificationPermission | "unsupported";
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
  });

  // Initialize state
  useEffect(() => {
    const isSupported = checkSupport();
    const permission = isSupported ? Notification.permission : "unsupported";

    setState((prev) => ({
      ...prev,
      isSupported,
      permission,
      isEnabled: permission === "granted",
      isLoading: false,
    }));

    // Set up foreground message listener
    if (isSupported && messaging) {
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log("[FCM] Foreground message received:", payload);

        // Show a toast or in-app notification
        // You can integrate with your existing toast system here
        if (payload.notification) {
          // For now, we'll show a native notification even in foreground
          // In production, you might want to show an in-app toast instead
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

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Request permission
      const permission = await Notification.requestPermission();

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

      // Wait for the service worker (registered by vite-plugin-pwa)
      const registration = await navigator.serviceWorker.ready;

      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration,
      });

      if (!token) {
        throw new Error("Failed to get FCM token");
      }

      // Save token to Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const platform = getPlatform();
      const deviceInfo = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
      };

      // Upsert token (update if exists, insert if new)
      const { error: upsertError } = await supabase
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
        );

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
