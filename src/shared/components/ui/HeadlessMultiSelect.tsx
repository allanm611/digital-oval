import { Fragment, useState } from "react";
import { Listbox, Transition } from "@headlessui/react";
import {
  CheckIcon,
  ChevronUpDownIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";

import { tw } from "../../../shared/utils/utils";
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
}: HeadlessMultiSelectProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const selectedOptions = options.filter((option) =>
    value.includes(option.value),
  );

  const filteredOptions = searchable
    ? options.filter((option) =>
        (option.label || "").toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : options;

  const handleRemove = (optionValue: string | number) => {
    onChange(value.filter((v) => v !== optionValue));
  };

  const displayText = () => {
    if (selectedOptions.length === 0) {
      return placeholder;
    }

    if (selectedOptions.length <= maxDisplayed) {
      return selectedOptions.map((option) => option.label).join(", ");
    }

    return `${selectedOptions
      .slice(0, maxDisplayed)
      .map((option) => option.label)
      .join(", ")} +${selectedOptions.length - maxDisplayed} more`;
  };

  return (
    <div className={`relative ${className}`}>
      <Listbox value={value} onChange={onChange} disabled={disabled} multiple>
        <div className="relative">
          <Listbox.Button
            className={`
            relative w-full cursor-default ${tw.rounded} bg-white py-3 pl-4 pr-10 text-left shadow-sm border transition-all duration-200
            ${error ? "border-red-300" : "border-gray-300"}
            ${
              disabled
                ? "bg-gray-50 text-gray-500 cursor-not-allowed"
                : "hover:border-gray-400"
            }
            focus:outline-none focus:ring-0 focus:border-gray-300
          `}
          >
            <span
              className={`block truncate ${
                selectedOptions.length > 0 ? "text-gray-900" : "text-gray-500"
              }`}
            >
              {displayText()}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </span>
          </Listbox.Button>

          {/* Selected Items Display */}
          {selectedOptions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedOptions.map((option) => (
                <span
                  key={option.value}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-[#3b8169]/10 text-[#3b8169] border border-[#3b8169]/20"
                >
                  {option.label}
                  <button
                    type="button"
                    onClick={() => handleRemove(option.value)}
                    className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-[#3b8169]/20 transition-colors"
                  >
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options
              className={`absolute z-10 mt-1 max-h-60 w-full overflow-auto ${tw.rounded} bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm`}
            >
              {searchable && (
                <div className="px-3 py-2 border-b border-gray-200">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search options..."
                    className={`w-full px-3 py-2 text-sm border border-gray-200 ${tw.rounded} focus:outline-none focus:ring-0 focus:border-gray-200`}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}

              {filteredOptions.length === 0 ? (
                <div className="relative cursor-default select-none py-2 pl-10 pr-4 text-gray-500">
                  No options found.
                </div>
              ) : (
                filteredOptions.map((option) => (
                    <Listbox.Option
                      key={option.value}
                      value={option.value}
                      disabled={option.disabled}
                      className={({ active, disabled }) =>
                        `relative cursor-default select-none py-2 pl-10 pr-4 transition-colors duration-150 ${
                          active ? "bg-gray-100 text-gray-900" : "text-gray-900"
                        } ${
                          disabled
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer"
                        }`
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span
                            className={`block truncate ${
                              selected ? "font-medium" : "font-normal"
                            }`}
                          >
                            {option.label}
                          </span>
                          {selected ? (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#3b8169]">
                              <CheckIcon
                                className="h-5 w-5"
                                aria-hidden="true"
                              />
                            </span>
                          ) : null}
                        </>
                      )}
                    </Listbox.Option>
                  ))
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
}
