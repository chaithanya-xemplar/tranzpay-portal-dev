import { forwardRef } from "react";
import clsx from "clsx";
import FieldError from "./FieldError";

interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
  helper?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, leftIcon, rightIcon, className, containerClassName, helper, id, ...props },
    ref
  ) => {
    const inputId = id || props.name;

    return (
      <div className={clsx("flex flex-col gap-1", containerClassName)}>
        {label && (
          <label htmlFor={inputId} className="label-base">
            {label}
            {props.required && <span className="text-error ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center text-light-grey pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={clsx(
              "input-base-form",
              leftIcon && "pl-10!",
              rightIcon && "pr-10!",
              error && "error",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center text-light-grey pointer-events-none">
              {rightIcon}
            </span>
          )}
        </div>
        {helper && <p className="helper-base">{helper}</p>}
        <FieldError message={error} />
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
