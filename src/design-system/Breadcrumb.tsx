import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import Icon from "./Icon";

export interface BreadcrumbItem {
  label: string;
  /** In-app route — renders a react-router Link (SPA navigation). Takes precedence over href. */
  to?: string;
  /** External/plain anchor — full page load. */
  href?: string;
  icon?: ReactNode;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={clsx("flex items-center gap-1 text-xs", className)}>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <Icon name="chevron-right" size={12} className="text-light-grey shrink-0" />}
            {item.to && !isLast ? (
              <Link
                to={item.to}
                className="text-light-grey hover:text-primary transition flex items-center gap-1"
              >
                {item.icon}
                {item.label}
              </Link>
            ) : item.href && !isLast ? (
              <a
                href={item.href}
                className="text-light-grey hover:text-primary transition flex items-center gap-1"
              >
                {item.icon}
                {item.label}
              </a>
            ) : (
              <span
                className={clsx(
                  "flex items-center gap-1",
                  isLast ? "text-medium-grey font-semibold" : "text-light-grey"
                )}
              >
                {item.icon}
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
