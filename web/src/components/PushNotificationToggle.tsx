import { usePushNotifications } from "../hooks/usePushNotifications";

export default function PushNotificationToggle() {
  const { isSupported, isEnabled, isLoading, error, permission, requestPermission, unregister } =
    usePushNotifications();

  if (!isSupported) {
    return (
      <div className="push-notification-toggle">
        <div className="push-status push-status-unsupported">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="push-icon">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
          <div>
            <span className="push-label">Push notifications not supported</span>
            <span className="push-hint">Try using Chrome, Firefox, or Safari 16.4+</span>
          </div>
        </div>
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="push-notification-toggle">
        <div className="push-status push-status-denied">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="push-icon">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
          <div>
            <span className="push-label">Notifications blocked</span>
            <span className="push-hint">Enable in browser settings to receive push notifications</span>
          </div>
        </div>
      </div>
    );
  }

  const handleToggle = async () => {
    if (isEnabled) {
      await unregister();
    } else {
      await requestPermission();
    }
  };

  return (
    <div className="push-notification-toggle">
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={isEnabled}
          onChange={handleToggle}
          disabled={isLoading}
        />
        <span>
          {isLoading ? "Setting up..." : "Enable push notifications"}
        </span>
      </label>
      {isEnabled && (
        <span className="push-hint push-hint-success">
          You'll receive notifications even when the app is closed
        </span>
      )}
      {error && <span className="push-hint push-hint-error">{error}</span>}
    </div>
  );
}
