import Button from "./Button";

interface NtfyHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NtfyHelpModal({ isOpen, onClose }: NtfyHelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content ntfy-help-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Setting up ntfy Push Notifications</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        <div className="modal-body">
          <p className="muted">
            ntfy is a simple push notification service that works on Android and iOS.
            Follow these steps to receive notifications on your phone.
          </p>

          <div className="ntfy-instructions">
            <h3>Step 1: Install the ntfy app</h3>
            <p>
              Download ntfy from the{" "}
              <a
                href="https://play.google.com/store/apps/details?id=io.heckel.ntfy"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Play Store
              </a>
              {" "}or{" "}
              <a
                href="https://apps.apple.com/us/app/ntfy/id1625396347"
                target="_blank"
                rel="noopener noreferrer"
              >
                App Store
              </a>
            </p>

            <h3>Step 2: Subscribe to the topic</h3>
            <ol>
              <li>Open the ntfy app and tap the "+" button</li>
              <li>
                Enter topic: <code>mariani_music_league</code>
              </li>
              <li>Check "Use another server" and enter: <code>https://ntfy.mattmariani.com</code></li>
              <li>Tap "Subscribe"</li>
            </ol>

            <div className="ntfy-screenshot">
              <img
                src="/ntfy_subscribe.png"
                alt="ntfy app subscribe screen showing topic and server fields"
              />
            </div>

            <div className="ntfy-note">
              <strong>Note:</strong> On iOS, you may need to enable notifications
              for the ntfy app in your device Settings.
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <Button variant="primary" onClick={onClose}>
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
}
