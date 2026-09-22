import { useRef, useCallback, type ReactNode } from "react";
import clsx from "clsx";
import Icon from "./Icon";
import Field from "./Field";

type FormatAction = "bold" | "italic" | "underline" | "bullet" | "ordered";

interface RichTextProps {
  label?: string;
  value: string;
  onChange: (html: string) => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

function exec(action: string, val?: string) {
  document.execCommand(action, false, val);
}

const toolbar: { icon: ReactNode; action: FormatAction; title: string }[] = [
  { icon: <Icon name="bold" size={16} />, action: "bold", title: "Bold" },
  { icon: <Icon name="italic" size={16} />, action: "italic", title: "Italic" },
  { icon: <Icon name="underline" size={16} />, action: "underline", title: "Underline" },
  { icon: <Icon name="list" size={16} />, action: "bullet", title: "Bullet List" },
];

export default function RichText({
  label,
  value,
  onChange,
  error,
  placeholder = "Type here...",
  disabled,
  className,
}: RichTextProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  const handleAction = useCallback(
    (action: FormatAction) => {
      if (disabled) return;
      switch (action) {
        case "bold":
          exec("bold");
          break;
        case "italic":
          exec("italic");
          break;
        case "underline":
          exec("underline");
          break;
        case "bullet":
          exec("insertUnorderedList");
          break;
        case "ordered":
          exec("insertOrderedList");
          break;
      }
      editorRef.current?.focus();
      // onChange after short timeout so execCommand updates the DOM
      setTimeout(() => {
        onChange(editorRef.current?.innerHTML ?? "");
      }, 0);
    },
    [disabled, onChange]
  );

  const handleInput = () => {
    onChange(editorRef.current?.innerHTML ?? "");
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };

  return (
    <Field label={label} error={error} className={className}>
      <div
        className={clsx(
          "border border-divider rounded-md overflow-hidden",
          error && "border-error",
          disabled && "opacity-50 pointer-events-none"
        )}
      >
        {/* Toolbar */}
        <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-divider bg-white">
          {toolbar.map((t) => (
            <button
              key={t.action}
              type="button"
              title={t.title}
              onClick={() => handleAction(t.action)}
              className="p-1.5 rounded text-medium-grey hover:bg-divider2 hover:text-dark-grey transition"
            >
              {t.icon}
            </button>
          ))}
        </div>

        {/* Editor */}
        <div
          ref={editorRef}
          contentEditable={!disabled}
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          onInput={handleInput}
          onPaste={handlePaste}
          className={clsx(
            "min-h-[120px] p-3 text-sm text-medium-grey focus:outline-none",
            !value && "text-light-grey"
          )}
          data-placeholder={placeholder}
          dangerouslySetInnerHTML={{ __html: value }}
          style={{ whiteSpace: "pre-wrap" }}
        />
      </div>
    </Field>
  );
}
