import type { SVGProps } from "react";
import clsx from "clsx";
import { icons, type IconName } from "./iconMap";

export type { IconName };

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
}

export default function Icon({ name, size = 16, className, ...props }: IconProps) {
  const Component = icons[name];

  return (
    <Component
      className={clsx("shrink-0", className)}
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      {...props}
    />
  );
}
