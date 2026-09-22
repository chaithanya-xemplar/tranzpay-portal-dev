import { forwardRef } from "react";
import clsx from "clsx";
import FieldError from "./FieldError";

interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, className, containerClassName, id, ...props }, ref) => {
    const textareaId = id || props.name;

    return (
      <div className={clsx("flex flex-col gap-1", containerClassName)}>
        {label && (
          <label htmlFor={textareaId} className="label-base">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={clsx(
            "input-base-form resize-y min-h-[80px]",
            error && "error",
            className
          )}
          {...props}
        />
        <FieldError message={error} />
      </div>
    );
  }
);

TextArea.displayName = "TextArea";
export default TextArea;
