import { useCallback } from "react";

interface UseCsvDownloadOptions {
  filename?: string;
  defaultFilename?: string;
}

interface UseCsvDownloadReturn {
  downloadCsv: (
    headers: string[],
    rows: (string | number)[][],
    filename?: string,
  ) => void;
}

/**
 * Hook to handle CSV download functionality
 * Provides a reusable way to generate and download CSV files from table data
 *
 * @param options - Configuration options
 * @param options.defaultFilename - Default filename if not specified in downloadCsv call
 * @returns Object with downloadCsv function
 *
 * @example
 * const { downloadCsv } = useCsvDownload({ defaultFilename: 'report.csv' });
 * downloadCsv(['Name', 'Email'], [['John', 'john@example.com']], 'contacts.csv');
 */
export const useCsvDownload = (
  options?: UseCsvDownloadOptions,
): UseCsvDownloadReturn => {
  const escapeCsvValue = useCallback((value: string | number): string => {
    const stringValue = String(value);
    if (
      stringValue.includes(",") ||
      stringValue.includes('"') ||
      stringValue.includes("\n")
    ) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  }, []);

  const downloadCsv = useCallback(
    (headers: string[], rows: (string | number)[][], filename?: string) => {
      if (!headers.length && !rows.length) return;

      try {
        // Format headers
        const escapedHeaders = headers.map(escapeCsvValue);

        // Format rows
        const escapedRows = rows.map((row) =>
          row.map(escapeCsvValue).join(","),
        );

        // Combine headers and rows
        const csvContent = [escapedHeaders.join(","), ...escapedRows].join(
          "\n",
        );

        // Create blob and download
        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute(
          "download",
          filename || options?.defaultFilename || "data.csv",
        );
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("CSV download failed:", error);
        throw error;
      }
    },
    [escapeCsvValue, options?.defaultFilename],
  );

  return { downloadCsv };
};

export default useCsvDownload;
