import { useEffect, useMemo, useState } from "react";
import Input from "../../../shared/components/ui/Input";
import { tw } from "../../../shared/utils/utils";

export function parseCommaSeparatedOptions(text: string): string[] {
  return String(text ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

export function formatCommaSeparatedOptions(options: string[] | undefined): string {
  return (options || []).join(", ");
}

function sameOptions(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

interface CommaSeparatedOptionsInputProps {
  label?: string;
  value: string[];
  onChange: (options: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  error?: string;
  helperText?: string;
}

/**
 * Controlled comma-separated options editor that keeps draft text while typing.
 * Eager split/trim/filter on keystroke used to drop trailing commas ("days," → "days"),
 * which made multi-option entry feel broken.
 */
export default function CommaSeparatedOptionsInput({
  label = "Options (comma-separated) *",
  value,
  onChange,
  placeholder = "e.g. days, hours, months",
  disabled = false,
  hasError = false,
  error,
  helperText = "Separate each option with a comma.",
}: CommaSeparatedOptionsInputProps) {
  const [text, setText] = useState(() => formatCommaSeparatedOptions(value));
  const optionsKey = useMemo(
    () => formatCommaSeparatedOptions(value),
    [value],
  );

  useEffect(() => {
    const parsedFromText = parseCommaSeparatedOptions(text);
    if (!sameOptions(parsedFromText, value || [])) {
      setText(formatCommaSeparatedOptions(value));
    }
    // Sync only when parent options diverge from the current draft parse.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionsKey]);

  const preview = parseCommaSeparatedOptions(text);

  return (
    <div>
      <Input
        label={label}
        value={text}
        onChange={(next) => {
          const draft = String(next);
          setText(draft);
          onChange(parseCommaSeparatedOptions(draft));
        }}
        onBlur={() => {
          const normalized = parseCommaSeparatedOptions(text);
          setText(formatCommaSeparatedOptions(normalized));
          onChange(normalized);
        }}
        placeholder={placeholder}
        disabled={disabled}
        hasError={hasError}
      />
      {error ? (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      ) : helperText ? (
        <p className={`text-xs ${tw.textMuted} mt-1`}>{helperText}</p>
      ) : null}
      {preview.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {preview.map((option) => (
            <span
              key={option}
              className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded border border-gray-200 bg-white text-gray-700"
            >
              {option}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
