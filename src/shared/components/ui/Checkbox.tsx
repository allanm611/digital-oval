import React from "react";
import { Check } from "lucide-react";
import { color } from "../../utils/utils";

interface CheckboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  // Controlled component - requires checked prop
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  id?: string;
}

export default function Checkbox({
  className = "",
  checked,
  onChange,
  disabled = false,
  id,
  ...inputProps
}: CheckboxProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!disabled && inputRef.current) {
      const input = inputRef.current;
      // Toggle the checked state
      input.checked = !input.checked;

      // Create a synthetic change event with proper target
      const changeEvent = new Event('change', { bubbles: true });
      Object.defineProperty(changeEvent, 'target', {
        writable: false,
        value: input,
      });

      // Call onChange with the event
      onChange(changeEvent as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e);
  };

  return (
    <span
      className={`relative inline-flex items-center justify-center cursor-pointer ${className}`}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        {...inputProps}
        id={id}
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        className="peer sr-only"
      />
      <span className="inline-flex h-5 w-5 items-center justify-center rounded border border-gray-300 bg-white transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#00BBCC]/30 peer-disabled:opacity-50 peer-checked:[&>svg]:opacity-100">
        <Check
          className="h-4 w-4 opacity-0 transition-opacity"
          style={{ color: color.primary.accent }}
        />
      </span>
    </span>
  );
}
