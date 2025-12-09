import { Fragment, useState } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { components } from "../../utils/utils";

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
}: HeadlessSelectProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const selectedOption = options.find((option) => option.value === value);

  const filteredOptions = searchable
    ? options.filter((option) =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  return (
    <div className={`relative ${className}`} style={{ zIndex: 99999 }}>
      <Listbox value={value} onChange={onChange} disabled={disabled}>
        <div className="relative w-full">
          <Listbox.Button
            className={`
            relative w-full cursor-default py-2 px-3 pr-10 text-left transition-all duration-200 text-sm
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

          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options
              className={`absolute z-[99999] max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg border border-gray-300 focus:outline-none sm:text-sm ${
                openUpward ? "bottom-full mb-1" : "top-full mt-1"
              }`}
              style={{
                minWidth: "100%",
                maxWidth: "100%",
                left: 0,
                right: 0,
                zIndex: 99999,
              }}
            >
              {searchable && (
                <div className="sticky top-0 bg-white z-10 px-3 py-2 border-b border-gray-200">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search options..."
                    className="w-full px-2 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-0 focus:border-gray-200"
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
                  <Listbox.Option
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    className={({ active, disabled }) =>
                      `relative cursor-default select-none py-2.5 pl-3 pr-6 transition-colors duration-150 whitespace-nowrap ${
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
                          className={`block ${
                            selected ? "font-medium" : "font-normal"
                          }`}
                        >
                          {option.label}
                        </span>
                      </>
                    )}
                  </Listbox.Option>
                ))
              )}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
}
