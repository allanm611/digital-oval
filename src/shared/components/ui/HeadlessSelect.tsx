import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Listbox } from "@headlessui/react";
import { ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { components, tw, zIndex as zIndexTokens } from "../../utils/utils";

interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
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
  openUpward?: boolean;
  zIndex?: number;
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
  openUpward = false,
  zIndex,
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
  const buttonRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((option) => option.value === value);

  const filteredOptions = searchable
    ? options.filter((option) =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : options;

  // Update position when dropdown opens or window scrolls
  useEffect(() => {
    const updatePosition = () => {
      if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: openUpward ? rect.top - 300 : rect.bottom + 4,
          left: rect.left,
          width: rect.width,
        });
      }
    };

    if (isOpen) {
      updatePosition();
      window.addEventListener("scroll", updatePosition);
      window.addEventListener("resize", updatePosition);
      return () => {
        window.removeEventListener("scroll", updatePosition);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [isOpen, openUpward]);

  return (
    <div className={`relative ${className}`}>
      <Listbox value={value} onChange={(newValue) => {
        onChange(newValue);
      }} disabled={disabled}>
        <div className="relative w-full" ref={buttonRef}>
          <Listbox.Button
            onClick={() => {
              setIsOpen(!isOpen);
            }}
            className={`
            relative w-full cursor-default py-3 px-3 pr-10 text-left transition-all duration-200 text-sm
            ${error ? components.input.error : components.input.default}
            ${
              disabled
                ? "bg-gray-50 text-gray-500 cursor-not-allowed opacity-50"
                : ""
            }
            focus:outline-none focus:ring-0
          `}
          >
            {" "}
            <span
              className={`block text-sm ${
                selectedOption ? "text-gray-900" : "text-gray-500"
              }`}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </span>
          </Listbox.Button>
        </div>
      </Listbox>

      {isOpen && (
        <>
          {createPortal(
            <div
              className={`${tw.rounded} bg-white py-1 text-base shadow-lg border border-gray-300 focus:outline-none sm:text-sm max-h-80 overflow-auto pointer-events-auto`}
              style={{
                position: "fixed",
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
                width: `${dropdownPosition.width}px`,
                zIndex: effectiveZIndex,
              }}
            >
            {searchable && (
              <div
                className="sticky top-0 bg-white z-10 px-3 py-2 border-b border-gray-200"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search options..."
                  className={`w-full px-2 py-1 text-sm border border-gray-200 ${tw.rounded} focus:outline-none focus:ring-0 focus:border-gray-200`}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}

            {filteredOptions.length === 0 ? (
              <div className="relative cursor-default select-none py-2.5 pl-10 pr-6 text-gray-500 whitespace-nowrap">
                No options found.
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`relative cursor-default select-none py-2.5 pl-3 pr-6 transition-colors duration-150 whitespace-nowrap ${
                    value === option.value
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-900 hover:bg-gray-50"
                  } ${
                    option.disabled
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                >
                  <span
                    className={`block ${
                      value === option.value ? "font-medium" : "font-normal"
                    }`}
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
