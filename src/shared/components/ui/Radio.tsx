import React from "react";
import { color } from "../../utils/utils";

interface RadioProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label?: string;
  children?: React.ReactNode;
  wrapperClassName?: string;
}

export default function Radio({
  label,
  children,
  className = "",
  wrapperClassName = "",
  ...inputProps
}: RadioProps) {
  const checked = inputProps.checked;

  const input = (
    <input
      {...inputProps}
      type="radio"
      className={`w-6 h-6 border border-gray-300 rounded-full bg-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed appearance-none ${className}`}
      style={{
        backgroundImage:
          checked !== undefined && checked
            ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ccircle cx='8' cy='8' r='3' fill='${color.primary.accent.replace("#", "%23")}'/%3E%3C/svg%3E")`
            : "none",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "100%",
        ...(inputProps.style || {}),
      }}
    />
  );

  if (!label && !children && !wrapperClassName) {
    return input;
  }

  return (
    <label
      className={`flex items-center gap-2 cursor-pointer ${wrapperClassName}`}
    >
      {input}
      {label && (
        <span className="text-sm font-medium text-gray-700">{label}</span>
      )}
      {!label && children}
    </label>
  );
}
