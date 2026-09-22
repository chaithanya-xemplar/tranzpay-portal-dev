import clsx from "clsx";
import Icon from "./Icon";

type AvatarSize = "sm" | "md" | "lg" | "xl";

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  className?: string;
}

const sizeStyles: Record<AvatarSize, string> = {
  sm: "w-8 h-8 text-[10px]",
  md: "w-10 h-10 text-xs",
  lg: "w-12 h-12 text-sm",
  xl: "w-16 h-16 text-base",
};

function getInitials(name?: string): string {
  if (!name) return "";
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function hslFromName(name?: string): string {
  if (!name) return "hsl(215, 26%, 32%)";
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${Math.abs(hash) % 360}, 45%, 50%)`;
}

export default function Avatar({
  src,
  alt = "",
  name,
  size = "md",
  className,
}: AvatarProps) {
  return (
    <div
      className={clsx(
        "relative inline-flex items-center justify-center rounded-full shrink-0 overflow-hidden font-bold text-white select-none",
        sizeStyles[size],
        !src && "bg-medium-grey",
        className
      )}
      style={!src && name ? { backgroundColor: hslFromName(name) } : undefined}
      title={name || alt}
    >
      {src ? (
        <img src={src} alt={alt || name || ""} className="w-full h-full object-cover" />
      ) : name ? (
        <span>{getInitials(name)}</span>
      ) : (
        <Icon name="user" size={size === "xl" ? 24 : size === "lg" ? 18 : 14} />
      )}
    </div>
  );
}
