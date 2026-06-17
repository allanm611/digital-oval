import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Listbox } from "@headlessui/react";
import { ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { components, tw, zIndex as zIndexTokens } from "../../utils/utils";

interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  id?: string | number; // Unique identifier for React key
}

interface HeadlessSelectProps {
  options: SelectOption[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  className?: string;
  searchable?: boolean;
  zIndex?: number;
  label?: string;
}

export default function HeadlessSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  disabled = false,
  error = false,
  className = "",
  searchable = false,
  zIndex,
  label,
}: HeadlessSelectProps) {
  // Always use popover z-index by default so dropdowns appear above modals
  const effectiveZIndex = zIndex ?? zIndexTokens.popover;
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const [isAbove, setIsAbove] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((option) => option.value === value);

  const filteredOptions = searchable
    ? options.filter((option) =>
        (option.label || "").toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : options;

  // Update position when dropdown opens or window scrolls
  useEffect(() => {
    const updatePosition = () => {
      if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();

        // Find parent scrollable container (modal, sidebar, etc.)
        let container = buttonRef.current.parentElement;
        let containerRect = null;
        let isInContainer = false;

        while (container && container !== document.body) {
          const style = window.getComputedStyle(container);
          if (style.overflow === 'auto' || style.overflow === 'scroll' || style.overflowY === 'auto' || style.overflowY === 'scroll') {
            containerRect = container.getBoundingClientRect();
            isInContainer = true;
            break;
          }
          container = container.parentElement;
        }

        // Use container bounds if found, otherwise use viewport
        const bottomBound = isInContainer && containerRect ? containerRect.bottom : window.innerHeight;
        const topBound = isInContainer && containerRect ? containerRect.top : 0;

        const spaceBelow = bottomBound - rect.bottom;
        const spaceAbove = rect.top - topBound;

        // Use actual dropdown height if available, otherwise estimate conservatively
        const dropdownHeight = dropdownRef.current?.scrollHeight || 200;
        const GAP_BELOW = 4;
        const GAP_ABOVE = 8; // Extra space when flipped above
        const MIN_EDGE_PADDING = 8; // Minimum distance from edges

        // Auto-flip: use above if not enough space below and sufficient space above
        const shouldBeAbove =
          spaceBelow < dropdownHeight + GAP_BELOW + MIN_EDGE_PADDING &&
          spaceAbove - dropdownHeight > MIN_EDGE_PADDING;

        setIsAbove(shouldBeAbove);
        const gap = shouldBeAbove ? GAP_ABOVE : GAP_BELOW;
        setDropdownPosition({
          top: shouldBeAbove ? rect.top - dropdownHeight - gap : rect.bottom + gap,
          left: Math.max(0, Math.min(rect.left, window.innerWidth - rect.width)),
          width: rect.width,
        });
      }
    };

    if (isOpen) {
      // Measure after render
      const timer = requestAnimationFrame(updatePosition);
      window.addEventListener("scroll", updatePosition);
      window.addEventListener("resize", updatePosition);
      return () => {
        cancelAnimationFrame(timer);
        window.removeEventListener("scroll", updatePosition);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [isOpen]);

  const hasValue = value !== "" && value !== null && value !== undefined;

  // Without floating label (backward compatible)
  if (!label) {
    return (
      <div className={`relative ${className}`}>
        <Listbox
          value={value}
          onChange={(newValue) => {
            onChange(newValue);
          }}
          disabled={disabled}
        >
          <div className="relative w-full" ref={buttonRef}>
          <Listbox.Button
            onClick={() => {
              setIsOpen(!isOpen);
            }}
            className={`
            w-full cursor-default py-2 px-4 text-left transition-all duration-200 text-sm ${tw.rounded} border border-gray-200
            ${
              disabled
                ? "opacity-50 cursor-not-allowed"
                : ""
            }
            focus:outline-none focus:ring-0
          `}
            style={
              error
                ? { backgroundColor: 'var(--c-input-bg)', color: 'var(--c-text-primary)' }
                : disabled
                ? { backgroundColor: 'var(--c-input-disabled-bg)', color: 'var(--c-text-muted)' }
                : { backgroundColor: 'var(--c-input-bg)', color: 'var(--c-text-primary)' }
            }
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex-1 min-w-0">
                <span
                  className="block text-sm"
                  style={{
                    color: selectedOption ? 'var(--c-text-primary)' : 'var(--c-text-secondary)',
                  }}
                >
                  {selectedOption ? selectedOption.label : placeholder}
                </span>
              </div>
              <ChevronUpDownIcon
                className="h-5 w-5 flex-shrink-0 ml-2"
                style={{ color: 'var(--c-text-secondary)' }}
                aria-hidden="true"
              />
            </div>
          </Listbox.Button>
        </div>
      </Listbox>

      {isOpen && (
        <>
          {createPortal(
            <div
              ref={dropdownRef}
              className={`${tw.rounded} py-1 text-sm shadow-lg focus:outline-none max-h-80 overflow-auto pointer-events-auto`}
              style={{
                position: "fixed",
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
                width: `${dropdownPosition.width}px`,
                zIndex: effectiveZIndex,
                backgroundColor: 'var(--c-surface-background)',
                borderColor: 'var(--c-border-default)',
                borderWidth: '1px',
              }}
            >
              {searchable && (
                <div
                  className={`sticky top-0 z-10 px-3 py-2 ${tw.rounded}`}
                  style={{
                    backgroundColor: 'var(--c-surface-background)',
                    borderBottomColor: 'var(--c-border-default)',
                    borderBottomWidth: '1px',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search options..."
                    className={`w-full px-2 py-1 text-sm ${tw.rounded} focus:outline-none focus:ring-0`}
                    style={{
                      borderColor: 'var(--c-border-default)',
                      borderWidth: '1px',
                      backgroundColor: 'var(--c-input-bg)',
                      color: 'var(--c-text-primary)',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}

              {filteredOptions.length === 0 ? (
                <div className="relative cursor-default select-none py-2.5 pl-10 pr-6 text-sm whitespace-nowrap" style={{ color: 'var(--c-text-secondary)' }}>
                  No options found.
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <div
                    key={option.id ?? option.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`relative cursor-default select-none py-2.5 pl-3 pr-6 transition-colors duration-150 whitespace-nowrap ${
                      option.disabled
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                    style={
                      value === option.value
                        ? {
                            backgroundColor: 'var(--c-interactive-active)',
                            color: 'var(--c-text-primary)',
                          }
                        : {}
                    }
                    onMouseEnter={(e) => {
                      if (!option.disabled && value !== option.value) {
                        (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--c-interactive-hover)';
                        (e.currentTarget as HTMLElement).style.color = 'var(--c-text-primary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!option.disabled && value !== option.value) {
                        (e.currentTarget as HTMLElement).style.backgroundColor = '';
                        (e.currentTarget as HTMLElement).style.color = '';
                      }
                    }}
                  >
                    <span
                      className={`block text-sm ${
                        value === option.value ? "font-medium" : "font-normal"
                      }`}
                      style={{ color: 'inherit' }}
                    >
                      {option.label}
                    </span>
                  </div>
                ))
              )}
            </div>,
            document.body,
          )}
        </>
      )}

        {isOpen && (
          <div
            className="fixed inset-0"
            onClick={() => setIsOpen(false)}
            style={{ zIndex: effectiveZIndex - 1 }}
          />
        )}
      </div>
    );
  }

  // With floating label
  return (
    <div className={`relative w-full ${className}`}>
      <Listbox
        value={value}
        onChange={(newValue) => {
          onChange(newValue);
        }}
        disabled={disabled}
      >
        <div className="relative w-full" ref={buttonRef}>
          <Listbox.Button
            onClick={() => {
              setIsOpen(!isOpen);
            }}
            className={`w-full px-4 ${label ? 'pt-3 pb-3' : 'py-2'} text-left border ${tw.rounded} text-sm transition-all focus:outline-none focus:ring-0 ${
              disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"
            } ${
              error ? "border-red-300" : "border-gray-300"
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex-1 min-w-0">
                <span
                  className={`block text-sm ${
                    hasValue ? "text-gray-900" : "text-gray-500"
                  }`}
                >
                  {selectedOption && value ? selectedOption.label : (label ? "" : placeholder)}
                </span>
              </div>
              <ChevronUpDownIcon
                className="h-5 w-5 flex-shrink-0 ml-2"
                style={{ color: 'var(--c-text-secondary)' }}
                aria-hidden="true"
              />
            </div>
          </Listbox.Button>
        </div>
      </Listbox>

      {isOpen && (
        <>
          {createPortal(
            <div
              ref={dropdownRef}
              className={`${tw.rounded} py-1 text-sm shadow-lg focus:outline-none max-h-80 overflow-auto pointer-events-auto`}
              style={{
                position: "fixed",
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
                width: `${dropdownPosition.width}px`,
                zIndex: effectiveZIndex,
                backgroundColor: 'var(--c-surface-background)',
                borderColor: 'var(--c-border-default)',
                borderWidth: '1px',
              }}
            >
              {searchable && (
                <div
                  className={`sticky top-0 z-10 px-3 py-2 ${tw.rounded}`}
                  style={{
                    backgroundColor: 'var(--c-surface-background)',
                    borderBottomColor: 'var(--c-border-default)',
                    borderBottomWidth: '1px',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search options..."
                    className={`w-full px-2 py-1 text-sm ${tw.rounded} focus:outline-none focus:ring-0`}
                    style={{
                      borderColor: 'var(--c-border-default)',
                      borderWidth: '1px',
                      backgroundColor: 'var(--c-input-bg)',
                      color: 'var(--c-text-primary)',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}

              {filteredOptions.length === 0 ? (
                <div className="relative cursor-default select-none py-2.5 pl-10 pr-6 text-sm whitespace-nowrap" style={{ color: 'var(--c-text-secondary)' }}>
                  No options found.
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <div
                    key={option.id ?? option.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`relative cursor-default select-none py-2.5 pl-3 pr-6 transition-colors duration-150 whitespace-nowrap ${
                      option.disabled
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                    style={
                      value === option.value
                        ? {
                            backgroundColor: 'var(--c-interactive-active)',
                            color: 'var(--c-text-primary)',
                          }
                        : {}
                    }
                    onMouseEnter={(e) => {
                      if (!option.disabled && value !== option.value) {
                        (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--c-interactive-hover)';
                        (e.currentTarget as HTMLElement).style.color = 'var(--c-text-primary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!option.disabled && value !== option.value) {
                        (e.currentTarget as HTMLElement).style.backgroundColor = '';
                        (e.currentTarget as HTMLElement).style.color = '';
                      }
                    }}
                  >
                    <span
                      className={`block text-sm ${
                        value === option.value ? "font-medium" : "font-normal"
                      }`}
                      style={{ color: 'inherit' }}
                    >
                      {option.label}
                    </span>
                  </div>
                ))
              )}
            </div>,
            document.body,
          )}
        </>
      )}

      {isOpen && (
        <div
          className="fixed inset-0"
          onClick={() => setIsOpen(false)}
          style={{ zIndex: effectiveZIndex - 1 }}
        />
      )}

      {/* Floating Label */}
      {label && (
        <label
          className={`absolute left-3 transition-all duration-200 pointer-events-none font-medium z-10
            ${isOpen || hasValue
              ? "top-0 -translate-y-1/2 bg-white px-1 text-xs text-gray-700"
              : "top-1/2 -translate-y-1/2 text-sm text-gray-500"
            }`}
        >
          {label}
        </label>
      )}
    </div>
  );
}
