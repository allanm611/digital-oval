import React from "react";
import { color } from "../../utils/utils";

interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
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
  const checked = inputProps.checked;

  const input = (
    <input
      {...inputProps}
      type="checkbox"
      className={`w-6 h-6 border border-gray-300 rounded bg-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed appearance-none ${className}`}
      style={{
        accentColor: color.primary.accent,
        backgroundImage:
          checked !== undefined && checked
            ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpolyline points='3,8 6,11 13,4' stroke='${color.primary.accent.replace('#', '%23')}' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`
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
    <label className={`flex items-center gap-2 cursor-pointer ${wrapperClassName}`}>
      {input}
      {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
      {!label && children}
    </label>
  );
}
