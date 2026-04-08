import React from "react";
import { Check } from "lucide-react";
import { color } from "../../utils/utils";

interface CheckboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label?: string;
  children?: React.ReactNode;
  wrapperClassName?: string;
}

export default function Checkbox({
  label,
  children,
  className = "",
  wrapperClassName = "",
  ...inputProps
}: CheckboxProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const input = (
    <span
      className="relative inline-flex items-center justify-center cursor-pointer"
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        {...inputProps}
        type="checkbox"
        className="peer sr-only"
      />
      <span
        className={`inline-flex h-5 w-5 items-center justify-center rounded border border-gray-300 bg-white transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#00BBCC]/30 peer-disabled:opacity-50 peer-checked:[&>svg]:opacity-100 ${className}`}
      >
        <Check
          className="h-4 w-4 opacity-0 transition-opacity"
          style={{ color: color.primary.accent }}
        />
      </span>
    </span>
  );

  if (!label && !children && !wrapperClassName) {
    return input;
  }

  return (
    <label
      className={`flex items-center gap-2 cursor-pointer ${inputProps.disabled ? "opacity-70 cursor-not-allowed" : ""} ${wrapperClassName}`}
    >
      {input}
      {label && (
        <span className="text-sm font-medium text-gray-700">{label}</span>
      )}
      {!label && children}
    </label>
  );
}
