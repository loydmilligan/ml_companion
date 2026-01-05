import { useState } from "react";
import Button from "./Button";

interface NtfyHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NtfyHelpModal({ isOpen, onClose }: NtfyHelpModalProps) {
  const [activeTab, setActiveTab] = useState<"android" | "ios">("android");

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

          <div className="ntfy-tabs">
            <button
              className={`ntfy-tab ${activeTab === "android" ? "active" : ""}`}
              onClick={() => setActiveTab("android")}
            >
              Android
            </button>
            <button
              className={`ntfy-tab ${activeTab === "ios" ? "active" : ""}`}
              onClick={() => setActiveTab("ios")}
            >
              iOS
            </button>
          </div>

          {activeTab === "android" && (
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
              </p>

              <h3>Step 2: Add the self-hosted server</h3>
              <ol>
                <li>Open the ntfy app</li>
                <li>Tap the menu icon (three dots) in the top right</li>
                <li>Select "Settings"</li>
                <li>Tap "Add server"</li>
                <li>
                  Enter: <code>https://ntfy.mattmariani.com</code>
                </li>
                <li>Tap "Add"</li>
              </ol>

              <div className="ntfy-screenshot-placeholder">
                <div className="placeholder-box">
                  [Screenshot: Android - Adding server]
                </div>
              </div>

              <h3>Step 3: Subscribe to the topic</h3>
              <ol>
                <li>Tap the "+" button to add a subscription</li>
                <li>
                  Enter topic: <code>mariani_music_league</code>
                </li>
                <li>Make sure the server is set to "ntfy.mattmariani.com"</li>
                <li>Tap "Subscribe"</li>
              </ol>

              <div className="ntfy-screenshot-placeholder">
                <div className="placeholder-box">
                  [Screenshot: Android - Subscribing to topic]
                </div>
              </div>
            </div>
          )}

          {activeTab === "ios" && (
            <div className="ntfy-instructions">
              <h3>Step 1: Install the ntfy app</h3>
              <p>
                Download ntfy from the{" "}
                <a
                  href="https://apps.apple.com/us/app/ntfy/id1625396347"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  App Store
                </a>
              </p>

              <h3>Step 2: Add the self-hosted server</h3>
              <ol>
                <li>Open the ntfy app</li>
                <li>Tap "Settings" in the bottom tab bar</li>
                <li>Tap "Add server"</li>
                <li>
                  Enter URL: <code>https://ntfy.mattmariani.com</code>
                </li>
                <li>Tap "Add"</li>
              </ol>

              <div className="ntfy-screenshot-placeholder">
                <div className="placeholder-box">
                  [Screenshot: iOS - Adding server]
                </div>
              </div>

              <h3>Step 3: Subscribe to the topic</h3>
              <ol>
                <li>Go back to the main screen</li>
                <li>Tap the "+" button</li>
                <li>
                  Enter topic: <code>mariani_music_league</code>
                </li>
                <li>Select "ntfy.mattmariani.com" as the server</li>
                <li>Tap "Subscribe"</li>
              </ol>

              <div className="ntfy-screenshot-placeholder">
                <div className="placeholder-box">
                  [Screenshot: iOS - Subscribing to topic]
                </div>
              </div>

              <div className="ntfy-note">
                <strong>Note:</strong> On iOS, you may need to enable notifications
                for the ntfy app in your device Settings.
              </div>
            </div>
          )}
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
