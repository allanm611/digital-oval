import React from "react";

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
  const input = (
    <input
      {...inputProps}
      type="checkbox"
      className={`w-5 h-5 cursor-pointer border border-gray-300 rounded accent-black disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
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
