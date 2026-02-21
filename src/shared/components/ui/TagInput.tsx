import React, { useState, useRef, KeyboardEvent } from "react";
import { X, Plus } from "lucide-react";

import { tw } from "../../../shared/utils/utils";
interface TagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  maxTags?: number;
}

export default function TagInput({
  value,
  onChange,
  placeholder = "Add tags...",
  label,
  error,
  disabled = false,
  className = "",
  maxTags,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
      removeTag(value.length - 1);
    }
  };

  const addTag = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !value.includes(trimmedValue)) {
      if (!maxTags || value.length < maxTags) {
        onChange([...value, trimmedValue]);
        setInputValue("");
      }
    }
  };

  const removeTag = (index: number) => {
    const newTags = value.filter((_, i) => i !== index);
    onChange(newTags);
  };

  const handleInputBlur = () => {
    if (inputValue.trim()) {
      addTag();
    }
  };

  return (
    <div className={`${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      <div
        className={`
          min-h-[42px] w-full px-3 py-2 border ${tw.rounded} bg-white
          transition-all duration-200 focus-within:border-blue-500
          ${error ? "border-red-300" : "border-gray-300"}
          ${disabled ? "bg-gray-50 cursor-not-allowed" : "cursor-text"}
        `}
        onClick={() => inputRef.current?.focus()}
      >
        <div className="flex flex-wrap gap-2 items-center">
          {value.map((tag) => (
            <span
              key={tag}
              className={`inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 ${tw.rounded} animate-scale-in`}
            >
              {tag}
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTag(index);
                  }}
                  className="ml-1 hover:text-blue-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))}

          {(!maxTags || value.length < maxTags) && !disabled && (
            <div className="flex items-center flex-1 min-w-[120px]">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleInputBlur}
                placeholder={value.length === 0 ? placeholder : ""}
                className="flex-1 outline-none bg-transparent text-sm placeholder-gray-500"
                disabled={disabled}
              />
              {inputValue.trim() && (
                <button
                  type="button"
                  onClick={addTag}
                  className="ml-2 p-1 text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {maxTags && (
        <p className="mt-1 text-xs text-gray-500">
          {value.length}/{maxTags} tags
        </p>
      )}

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
