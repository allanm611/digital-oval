import React from "react";
import { Download } from "lucide-react";
import useCsvDownload from "../hooks/useCsvDownload";

interface CsvDownloadButtonProps {
  headers: string[];
  rows: (string | number)[][];
  filename?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  onDownload?: () => void;
  onError?: (error: Error) => void;
  style?: React.CSSProperties;
}

export const CsvDownloadButton: React.FC<CsvDownloadButtonProps> = ({
  headers,
  rows,
  filename = "data.csv",
  label = "Download CSV",
  className = "bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 text-sm rounded font-medium transition-colors disabled:cursor-not-allowed disabled:bg-gray-400",
  disabled = !headers.length && !rows.length,
  // variant = "primary",
  // size = "md",
  showIcon = true,
  onDownload,
  onError,
  style,
}) => {
  const { downloadCsv } = useCsvDownload({ defaultFilename: filename });

  const handleClick = () => {
    try {
      downloadCsv(headers, rows, filename);
      onDownload?.();
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Unknown error");
      onError?.(err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`flex items-center gap-2 ${className}`}
      style={style}
      title={
        disabled
          ? "No data available to download"
          : `Download as CSV (${filename})`
      }
    >
      {showIcon && <Download className="w-4 h-4" />}
      {label}
    </button>
  );
};

export default CsvDownloadButton;
