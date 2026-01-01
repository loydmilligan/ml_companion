import clsx from "clsx";

type AvatarProps = {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md";
  className?: string;
  framed?: boolean; // Add walnut wood frame
};

export default function Avatar({ src, name, size = "md", className, framed = false }: AvatarProps) {
  const initials = (name ?? "TM")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const avatarContent = (
    <div className={clsx("avatar", `avatar-${size}`, className)}>
      {src ? <img src={src} alt={name ?? "Avatar"} /> : <span>{initials}</span>}
    </div>
  );

  if (!framed) {
    return avatarContent;
  }

  // Walnut wood frame wrapper - CSS handles shimmer border, SVG shows inner wood texture
  return (
    <div className={clsx("avatar-frame", `avatar-frame-${size}`)}>
      <svg className="avatar-frame-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          {/* Walnut wood gradient */}
          <linearGradient id="walnutGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6d4c41" />
            <stop offset="30%" stopColor="#5d4037" />
            <stop offset="50%" stopColor="#795548" />
            <stop offset="70%" stopColor="#5d4037" />
            <stop offset="100%" stopColor="#4e342e" />
          </linearGradient>
        </defs>

        {/* Inner wood ring */}
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke="url(#walnutGradient)"
          strokeWidth="5"
        />

        {/* Inner bevel highlight */}
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="rgba(139, 90, 43, 0.3)"
          strokeWidth="1"
        />
      </svg>
      {avatarContent}
    </div>
  );
}
