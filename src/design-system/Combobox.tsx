import { useState, useRef, useEffect, useMemo } from "react";
import clsx from "clsx";
import Field from "./Field";

interface ComboboxOption {
  label: string;
  value: string;
}

interface ComboboxProps {
  label?: string;
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  maxDisplay?: number;
}

export default function Combobox({
  label,
  options,
  value,
  onChange,
  placeholder = "Type to search...",
  error,
  required,
  disabled,
  className,
  maxDisplay = 50,
}: ComboboxProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? "";

  const filtered = useMemo(() => {
    if (!query) return options.slice(0, maxDisplay);
    const q = query.toLowerCase();
    return options
      .filter((o) => o.label.toLowerCase().includes(q))
      .slice(0, maxDisplay);
  }, [options, query, maxDisplay]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectOption = (opt: ComboboxOption) => {
    onChange(opt.value);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filtered[highlightedIndex]) {
          selectOption(filtered[highlightedIndex]);
        }
        break;
      case "Escape":
        setOpen(false);
        break;
    }
  };

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [filtered]);

  return (
    <Field label={label} required={required} error={error} id="combobox-input" className={className}>
      <div className="relative" ref={containerRef}>
        <input
          ref={inputRef}
          id="combobox-input"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          className={clsx("input-base-form", error && "error")}
          placeholder={selectedLabel || placeholder}
          value={open ? query : selectedLabel}
          disabled={disabled}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (!disabled) {
              setQuery("");
              setOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
        />

        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-light-grey pointer-events-none">
          <svg className={clsx("w-4 h-4 transition", open && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>

        {open && (
          <ul
            ref={listRef}
            role="listbox"
            className="absolute z-50 mt-1 w-full bg-white border border-divider rounded-md shadow-lg max-h-60 overflow-auto text-sm"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-center text-light-grey text-xs">
                No results found
              </li>
            ) : (
              filtered.map((opt, i) => (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={opt.value === value}
                  className={clsx(
                    "px-3 py-2 cursor-pointer transition",
                    opt.value === value
                      ? "bg-primary_light2 text-primary font-semibold"
                      : "text-medium-grey hover:bg-divider2",
                    highlightedIndex === i && "bg-divider2"
                  )}
                  onMouseDown={() => selectOption(opt)}
                >
                  {opt.label}
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </Field>
  );
}
