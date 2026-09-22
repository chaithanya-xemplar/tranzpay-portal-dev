// src/components/Dropdown.tsx
import { useState, useRef, useEffect, type ReactNode } from "react";
import clsx from "clsx";

export type DropdownItem = {
  label: string;
  value: string;
  checked?: boolean; // ✅ if present → show toggle, else just link
};

interface DropdownProps {
  label?: string;
  items: DropdownItem[];
  onSelect: (value: string) => void;
  btnClassName?: string;
  icon?: ReactNode | string;
  iconPosition?: "left" | "right";
  menuClassName?: string;
  itemClassName?: string;
  keepOpenOnSelect?: boolean;
  triggerContent?: ReactNode;
}

const Dropdown: React.FC<DropdownProps> = ({
  label,
  items,
  onSelect,
  btnClassName = "",
  menuClassName = "",
  icon,
  iconPosition = "right",
  itemClassName = "hover:bg-grey-100",
  keepOpenOnSelect = true,
  triggerContent,
}) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (value: string) => {
    onSelect(value);
    if (!keepOpenOnSelect) {
      setOpen(false);
    }
  };

  // ✅ detect if this is icon-only (no label, no custom trigger)
  const isIconOnly = !label && !triggerContent && icon;

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={clsx(
          "transition focus:outline-none inline-flex items-center justify-center",
          isIconOnly
            ? "p-1 bg-transparent border-none"
            : "px-4 py-2 font-semibold gap-2 h-9 border rounded border-primary_light1 bg-primary_light2 text-primary text-semibold text-xs",
          btnClassName
        )}
      >
        {triggerContent ? (
          triggerContent
        ) : (
          <>
            {typeof icon === "string" ? (
              <img src={icon} alt="icon" className="w-4 h-4" />
            ) : (
              <>
                {icon && iconPosition === "left" && icon}
                {label && <span>{label}</span>}
                {icon && iconPosition === "right" && icon}
              </>
            )}
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div
          className={clsx(
            "absolute right-0 mt-1 w-52 shadow-lg z-50 bg-white border rounded border-divider text-xs text-dark-grey",
            menuClassName
          )}
        >
          <ul className="py-1">
            {items.map((item) => (
              <li
                key={item.value}
                className="border-b border-divider last:border-b-0"
              >
                <button
                  onClick={() => handleSelect(item.value)}
                  className={clsx(
                    "w-full flex items-center justify-between px-3 py-2 text-left transition hover:bg-grey-100",
                    itemClassName,
                    !("checked" in item) && "cursor-pointer"
                  )}
                >
                  <span>{item.label}</span>

                  {/* ✅ Toggle only if checked is defined */}
                  {typeof item.checked === "boolean" && (
                    <span
                      className={clsx(
                        "relative inline-flex h-4 w-7 flex-shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out",
                        item.checked
                          ? "bg-primary border-primary"
                          : "bg-gray-300 border-gray-300"
                      )}
                    >
                      <span
                        className={clsx(
                          "inline-block h-3 w-3 transform rounded-full bg-white transition duration-200 ease-in-out",
                          item.checked ? "translate-x-3" : "translate-x-0"
                        )}
                      />
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Dropdown;
