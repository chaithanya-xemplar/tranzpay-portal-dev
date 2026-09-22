import { forwardRef } from "react";
import clsx from "clsx";
import Icon from "../components/Icon/Icon";
import type { IconName } from "../components/Icon/iconMap";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: IconName;
  iconComponent?: React.FC<React.SVGProps<SVGSVGElement>>;
  iconPosition?: "left" | "right";
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white border-transparent hover:bg-hover-background active:bg-primary",
  secondary: "bg-secondary text-white border-transparent hover:bg-secondary/90 active:bg-secondary",
  outline: "bg-primary_light2 text-primary border border-primary_light1 hover:bg-primary_light2 active:bg-primary_light1",
  ghost: "bg-transparent text-medium-grey border-transparent hover:bg-divider2 active:bg-divider",
  danger: "bg-error text-white border-transparent hover:bg-error/90 active:bg-error",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-6 py-3 text-base gap-2.5",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      iconComponent: IconComponent,
      iconPosition = "right",
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const iconElement = (() => {
      if (IconComponent) {
        return <IconComponent className="shrink-0" width={16} height={16} aria-hidden="true" />;
      }
      if (icon) {
        return <Icon name={icon} size={16} />;
      }
      return null;
    })();

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          "inline-flex items-center justify-center font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50 disabled:pointer-events-none rounded-md",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {loading && (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
        )}
        {!loading && iconElement && iconPosition === "left" && iconElement}
        {children && <span>{children}</span>}
        {!loading && iconElement && iconPosition === "right" && iconElement}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
