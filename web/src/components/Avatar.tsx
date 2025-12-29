import type React from "react";
import clsx from "clsx";

type AvatarProps = {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md";
  className?: string;
};

export default function Avatar({ src, name, size = "md", className }: AvatarProps) {
  const initials = (name ?? "TM")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={clsx("avatar", `avatar-${size}`, className)}>
      {src ? <img src={src} alt={name ?? "Avatar"} /> : <span>{initials}</span>}
    </div>
  );
}
