import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import Avatar from "./Avatar";
import { supabase } from "../lib/supabase";

type ProfileDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  profile: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    email?: string | null;
  } | null;
  onProfileUpdate?: () => void;
};

export default function ProfileDrawer({ isOpen, onClose, profile, onProfileUpdate }: ProfileDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const timeout = setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleAvatarUpload = async (file: File) => {
    if (!profile) return;
    setUploading(true);
    setError(null);
    const fileExt = file.name.split(".").pop() ?? "png";
    const filePath = `${profile.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, {
      upsert: true,
    });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: data.publicUrl })
      .eq("id", profile.id);

    if (updateError) {
      setError(updateError.message);
    } else if (onProfileUpdate) {
      await onProfileUpdate();
    }
    setUploading(false);
  };

  return (
    <div
      ref={drawerRef}
      className={clsx("profile-drawer", isOpen && "open")}
      role="region"
      aria-label="Profile information"
      aria-hidden={!isOpen}
    >
      <div className="profile-drawer-content">
        <div className="profile-drawer-header">
          <div className="profile-drawer-avatar-wrapper">
            <Avatar src={profile?.avatar_url} name={profile?.display_name} size="md" />
            <label className="profile-drawer-avatar-upload">
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) handleAvatarUpload(file);
                }}
                disabled={uploading}
              />
              <span className="profile-drawer-avatar-overlay">
                {uploading ? (
                  <svg className="spinner" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="31.4" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                )}
              </span>
            </label>
          </div>
          <div className="profile-drawer-info">
            <h2>{profile?.display_name ?? "Family Member"}</h2>
            {profile?.email && <p className="profile-email">{profile.email}</p>}
          </div>
        </div>

        {error && <div className="profile-drawer-error">{error}</div>}

        <p className="profile-drawer-hint">Tap your avatar to change it</p>
      </div>
    </div>
  );
}
