import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

import { tw } from "../../../shared/utils/utils";
interface Option {
  id: string | number;
  label: string;
  value: string | number;
}

interface SelectProps {
  options: Option[];
  value: string | number | null;
  onChange: (value: string | number | null) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  searchable?: boolean;
}

export default function Select({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  label,
  error,
  disabled = false,
  className = "",
  searchable = false,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredOptions = searchable
    ? options.filter((option) =>
        (option.label || "").toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : options;

  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string | number) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className={`block text-sm font-medium ${tw.textSecondary} mb-2`}>
          {label}
        </label>
      )}

      <div ref={dropdownRef} className="relative">
        <div
          className={`
            relative w-full px-3 py-2 border ${tw.rounded} ${tw.surfaceBackground} cursor-pointer
            transition-all duration-200 focus-within:border-blue-500
            ${
              error
                ? "border-red-300"
                : `${tw.borderDefault} hover:border-[var(--c-border-muted)]`
            }
            ${disabled ? "bg-[var(--c-interactive-disabled)] cursor-not-allowed" : ""}
          `}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-sm ${
                selectedOption ? tw.textPrimary : tw.textMuted
              }`}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <ChevronDown
              className={`w-4 h-4 ${tw.textMuted} transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        </div>

        {isOpen && (
          <div
            className={`absolute z-50 w-full mt-1 ${tw.surfaceBackground} border ${tw.borderDefault} ${tw.rounded} shadow-lg max-h-60 overflow-hidden`}
          >
            {searchable && (
              <div className={`p-2 border-b ${tw.borderDefault}`}>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search options..."
                  className={`w-full px-3 py-2 text-sm border ${tw.borderDefault} ${tw.rounded} ${tw.surfaceBackground} ${tw.textPrimary} focus:outline-none`}
                />
              </div>
            )}

            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => {
                  const isSelected = value === option.value;
                  return (
                    <div
                      key={option.id}
                      onClick={() => handleSelect(option.value)}
                      className={`
                        flex items-center justify-between px-3 py-2 text-sm cursor-pointer transition-colors
                        ${
                          isSelected
                            ? "bg-blue-50 text-blue-700"
                            : `${tw.textSecondary} hover:bg-[var(--c-interactive-hover)]`
                        }
                      `}
                    >
                      <span>{option.label}</span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                  );
                })
              ) : (
                <div className={`px-3 py-2 text-sm ${tw.textMuted}`}>
                  No options found
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
