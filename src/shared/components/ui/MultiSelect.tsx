import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, X, Check } from "lucide-react";

import { tw } from '../../../shared/utils/utils';
interface Option {
  id: string | number;
  label: string;
  value: string | number;
}

interface MultiSelectProps {
  options: Option[];
  value: (string | number)[];
  onChange: (value: (string | number)[]) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export default function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select options...",
  label,
  error,
  disabled = false,
  className = "",
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOptions = options.filter((option) =>
    value.includes(option.value)
  );

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

  const handleToggleOption = (optionValue: string | number) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const handleRemoveOption = (optionValue: string | number) => {
    onChange(value.filter((v) => v !== optionValue));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      <div ref={dropdownRef} className="relative">
        <div
          className={`
            relative min-h-[42px] w-full px-3 py-2 border ${tw.rounded} bg-white cursor-pointer
            transition-all duration-200 focus-within:border-blue-500
            ${
              error ? "border-red-300" : "border-gray-300 hover:border-gray-400"
            }
            ${disabled ? "bg-gray-50 cursor-not-allowed" : ""}
          `}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <div className="flex flex-wrap gap-1 items-center">
            {selectedOptions.length > 0 ? (
              selectedOptions.map((option) => (
                <span
                  key={option.id}
                  className={`inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 ${tw.rounded}`}
                >
                  {option.label}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveOption(option.value);
                      }}
                      className="ml-1 hover:text-blue-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))
            ) : (
              <span className="text-gray-500 text-sm">{placeholder}</span>
            )}
          </div>

          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
            {selectedOptions.length > 0 && !disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearAll();
                }}
                className="text-gray-400 hover:text-gray-600 mr-1 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        </div>

        {isOpen && (
          <div className={`absolute z-50 w-full mt-1 bg-white border border-gray-200 ${tw.rounded} shadow-lg max-h-60 overflow-hidden`}>
            <div className="p-2 border-b border-gray-100">
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search options..."
                className={`w-full px-3 py-2 text-sm border border-gray-200 ${tw.rounded} focus:outline-none `}
              />
            </div>

            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => {
                  const isSelected = value.includes(option.value);
                  return (
                    <div
                      key={option.id}
                      onClick={() => handleToggleOption(option.value)}
                      className={`
                        flex items-center justify-between px-3 py-2 text-sm cursor-pointer transition-colors
                        ${
                          isSelected
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-700 hover:bg-gray-50"
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
                <div className="px-3 py-2 text-sm text-gray-500">
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
