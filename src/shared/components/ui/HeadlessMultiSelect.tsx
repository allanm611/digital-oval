import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CheckIcon, ChevronUpDownIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { tw, zIndex as zIndexTokens } from "../../utils/utils";

interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface HeadlessMultiSelectProps {
  options: SelectOption[];
  value: (string | number)[];
  onChange: (value: (string | number)[]) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  className?: string;
  searchable?: boolean;
  maxDisplayed?: number;
  showCheckboxes?: boolean;
  hideSelectedChips?: boolean;
  zIndex?: number;
}

export default function HeadlessMultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select options...",
  disabled = false,
  error = false,
  className = "",
  searchable = false,
  maxDisplayed = 3,
  showCheckboxes = false,
  hideSelectedChips = false,
  zIndex,
}: HeadlessMultiSelectProps) {
  const effectiveZIndex = zIndex ?? zIndexTokens.popover;
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const buttonRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const valueKeys = new Set(value.map((item) => String(item)));
  const selectedOptions = options.filter((option) =>
    valueKeys.has(String(option.value)),
  );

  const filteredOptions = searchable
    ? options.filter((option) =>
        (option.label || "").toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : options;

  const isSelected = (optionValue: string | number) =>
    valueKeys.has(String(optionValue));

  const toggleValue = (optionValue: string | number) => {
    const key = String(optionValue);
    if (valueKeys.has(key)) {
      onChange(value.filter((item) => String(item) !== key));
      return;
    }
    onChange([...value, optionValue]);
  };

  const handleRemove = (optionValue: string | number) => {
    onChange(value.filter((item) => String(item) !== String(optionValue)));
  };

  const displayText = () => {
    if (selectedOptions.length === 0) return placeholder;
    if (selectedOptions.length <= maxDisplayed) {
      return selectedOptions.map((option) => option.label).join(", ");
    }
    return `${selectedOptions
      .slice(0, maxDisplayed)
      .map((option) => option.label)
      .join(", ")} +${selectedOptions.length - maxDisplayed} more`;
  };

  useEffect(() => {
    const updatePosition = () => {
      if (!isOpen || !buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();

      let container = buttonRef.current.parentElement;
      let containerRect: DOMRect | null = null;
      while (container && container !== document.body) {
        const style = window.getComputedStyle(container);
        if (
          style.overflow === "auto" ||
          style.overflow === "scroll" ||
          style.overflowY === "auto" ||
          style.overflowY === "scroll"
        ) {
          containerRect = container.getBoundingClientRect();
          break;
        }
        container = container.parentElement;
      }

      const bottomBound = containerRect ? containerRect.bottom : window.innerHeight;
      const topBound = containerRect ? containerRect.top : 0;
      const spaceBelow = bottomBound - rect.bottom;
      const spaceAbove = rect.top - topBound;
      const dropdownHeight = dropdownRef.current?.scrollHeight || 240;
      const gap = 4;
      const shouldBeAbove =
        spaceBelow < dropdownHeight + gap + 8 && spaceAbove - dropdownHeight > 8;

      setDropdownPosition({
        top: shouldBeAbove ? rect.top - dropdownHeight - 8 : rect.bottom + gap,
        left: Math.max(0, Math.min(rect.left, window.innerWidth - rect.width)),
        width: rect.width,
      });
    };

    if (!isOpen) return undefined;
    const timer = requestAnimationFrame(updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      cancelAnimationFrame(timer);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, filteredOptions.length, searchTerm]);

  useEffect(() => {
    if (!isOpen) setSearchTerm("");
  }, [isOpen]);

  return (
    <div className={`relative ${className}`}>
      <div className="relative w-full" ref={buttonRef}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((open) => !open)}
          className={`w-full cursor-default py-2 px-4 text-left transition-all duration-200 text-sm ${tw.rounded} border focus:outline-none focus:ring-0 ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
          style={
            error
              ? {
                  backgroundColor: "var(--c-input-bg)",
                  color: "var(--c-text-primary)",
                  borderColor: "#ef4444",
                }
              : disabled
                ? {
                    backgroundColor: "var(--c-input-disabled-bg)",
                    color: "var(--c-text-muted)",
                    borderColor: "var(--c-border-default)",
                  }
                : {
                    backgroundColor: "var(--c-input-bg)",
                    color: "var(--c-text-primary)",
                    borderColor: "var(--c-border-default)",
                  }
          }
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <div className="flex items-center justify-between w-full">
            <span
              className="block truncate text-sm"
              style={{
                color:
                  selectedOptions.length > 0
                    ? "var(--c-text-primary)"
                    : "var(--c-text-secondary)",
              }}
            >
              {displayText()}
            </span>
            <ChevronUpDownIcon
              className="h-5 w-5 flex-shrink-0 ml-2"
              style={{ color: "var(--c-text-secondary)" }}
              aria-hidden="true"
            />
          </div>
        </button>
      </div>

      {!hideSelectedChips && selectedOptions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedOptions.map((option) => (
            <span
              key={String(option.value)}
              className="inline-flex items-center gap-2 px-2 py-1 rounded text-xs bg-gray-100 text-gray-700 border border-gray-300"
            >
              {option.label}
              <button
                type="button"
                onClick={() => handleRemove(option.value)}
                className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-[#3b8169]/20 transition-colors"
                aria-label={`Remove ${option.label}`}
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0"
          onClick={() => setIsOpen(false)}
          style={{ zIndex: effectiveZIndex - 1 }}
        />
      )}

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            role="listbox"
            aria-multiselectable="true"
            className={`${tw.rounded} py-1 text-sm shadow-lg focus:outline-none max-h-80 overflow-auto pointer-events-auto`}
            style={{
              position: "fixed",
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
              zIndex: effectiveZIndex,
              backgroundColor: "var(--c-surface-background)",
              borderColor: "var(--c-border-default)",
              borderWidth: "1px",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            {searchable && (
              <div
                className={`sticky top-0 z-10 px-3 py-2 ${tw.rounded}`}
                style={{
                  backgroundColor: "var(--c-surface-background)",
                  borderBottomColor: "var(--c-border-default)",
                  borderBottomWidth: "1px",
                }}
              >
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search options..."
                  className={`w-full px-2 py-1 text-sm ${tw.rounded} focus:outline-none focus:ring-0`}
                  style={{
                    borderColor: "var(--c-border-default)",
                    borderWidth: "1px",
                    backgroundColor: "var(--c-input-bg)",
                    color: "var(--c-text-primary)",
                  }}
                  onClick={(event) => event.stopPropagation()}
                />
              </div>
            )}

            {filteredOptions.length === 0 ? (
              <div
                className="relative cursor-default select-none py-2.5 pl-10 pr-6 text-sm"
                style={{ color: "var(--c-text-secondary)" }}
              >
                No options found.
              </div>
            ) : (
              filteredOptions.map((option) => {
                const selected = isSelected(option.value);
                return (
                  <div
                    key={String(option.value)}
                    role="option"
                    aria-selected={selected}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (!option.disabled) toggleValue(option.value);
                    }}
                    className={`relative cursor-default select-none py-2.5 pl-10 pr-6 transition-colors duration-150 ${
                      option.disabled
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                    style={
                      selected
                        ? {
                            backgroundColor: "var(--c-interactive-active)",
                            color: "var(--c-text-primary)",
                          }
                        : { color: "var(--c-text-primary)" }
                    }
                    onMouseEnter={(event) => {
                      if (!option.disabled && !selected) {
                        event.currentTarget.style.backgroundColor =
                          "var(--c-interactive-hover)";
                      }
                    }}
                    onMouseLeave={(event) => {
                      if (!option.disabled && !selected) {
                        event.currentTarget.style.backgroundColor = "";
                      }
                    }}
                  >
                    {showCheckboxes ? (
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <span
                          className={`inline-flex h-4 w-4 items-center justify-center rounded border ${
                            selected
                              ? "border-[#00BBCC] bg-[#00BBCC]/10"
                              : "border-gray-300 bg-white"
                          }`}
                        >
                          {selected ? (
                            <CheckIcon
                              className="h-3 w-3 text-[#00BBCC]"
                              aria-hidden="true"
                            />
                          ) : null}
                        </span>
                      </span>
                    ) : selected ? (
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#3b8169]">
                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    ) : null}
                    <span
                      className={`block truncate text-sm ${
                        selected ? "font-medium" : "font-normal"
                      }`}
                    >
                      {option.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
