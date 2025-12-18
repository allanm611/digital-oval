/**
 * File Parsing Utilities for Manual Broadcast
 * 
 * Provides functions to parse uploaded files (CSV, XLSX, XLS) and extract
 * column headers for Subscription ID field selection.
 * 
 * Requirements: 1.2, 1.3
 */

import * as XLSX from "xlsx";
import { FileParseResult } from "../types";

/**
 * Supported file MIME types for upload
 */
const SUPPORTED_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-excel", // .xls
  "text/csv", // .csv
];

/**
 * Supported file extensions
 */
const SUPPORTED_EXTENSIONS = [".xlsx", ".xls", ".csv"];

/**
 * Checks if a file has a supported format based on MIME type or extension.
 * 
 * @param file - The file to check
 * @returns true if the file format is supported
 */
export function isSupportedFileFormat(file: File): boolean {
  // Check MIME type
  if (SUPPORTED_MIME_TYPES.includes(file.type)) {
    return true;
  }
  
  // Fallback to extension check (some browsers may not set MIME type correctly)
  const extension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
  return SUPPORTED_EXTENSIONS.includes(extension);
}

/**
 * Parses an uploaded file and extracts column headers from the first row.
 * Supports CSV, XLSX, and XLS formats.
 * 
 * Requirements: 1.2 - WHEN a file is uploaded THEN the Manual_Broadcast_System 
 * SHALL parse the file headers and populate the Subscription ID field dropdown 
 * with available columns
 * 
 * @param file - The uploaded file to parse
 * @param maxSampleRows - Maximum number of sample data rows to extract (default: 5)
 * @returns Promise<FileParseResult> - Result containing columns, row count, and sample data
 */
export async function parseFileColumns(
  file: File,
  maxSampleRows: number = 5
): Promise<FileParseResult> {
  try {
    // Validate file format
    if (!isSupportedFileFormat(file)) {
      return {
        success: false,
        columns: [],
        rowCount: 0,
        error: "Unsupported file format. Please upload a CSV, XLSX, or XLS file.",
      };
    }

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Parse workbook
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    
    // Get first sheet
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return {
        success: false,
        columns: [],
        rowCount: 0,
        error: "The file contains no sheets.",
      };
    }
    
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convert to JSON to get data (header: 1 returns array of arrays)
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: "",
    }) as unknown[][];
    
    // Check if file has data
    if (jsonData.length === 0) {
      return {
        success: false,
        columns: [],
        rowCount: 0,
        error: "The file is empty.",
      };
    }
    
    // Extract column headers from first row
    const headerRow = jsonData[0];
    if (!headerRow || headerRow.length === 0) {
      return {
        success: false,
        columns: [],
        rowCount: 0,
        error: "The file has no column headers in the first row.",
      };
    }
    
    // Convert headers to strings and filter out empty ones
    const columns = headerRow
      .map((cell) => String(cell ?? "").trim())
      .filter((col) => col.length > 0);
    
    if (columns.length === 0) {
      return {
        success: false,
        columns: [],
        rowCount: 0,
        error: "No valid column headers found in the first row.",
      };
    }
    
    // Calculate row count (excluding header)
    const rowCount = Math.max(0, jsonData.length - 1);
    
    // Extract sample data (up to maxSampleRows)
    const sampleData: Record<string, string>[] = [];
    const dataRows = jsonData.slice(1, 1 + maxSampleRows);
    
    for (const row of dataRows) {
      const rowData: Record<string, string> = {};
      columns.forEach((col, index) => {
        const cellValue = (row as unknown[])[index];
        rowData[col] = String(cellValue ?? "").trim();
      });
      sampleData.push(rowData);
    }
    
    return {
      success: true,
      columns,
      rowCount,
      sampleData: sampleData.length > 0 ? sampleData : undefined,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return {
      success: false,
      columns: [],
      rowCount: 0,
      error: `Failed to parse file: ${errorMessage}`,
    };
  }
}

/**
 * Validates that a selected Subscription ID column exists in the parsed file headers.
 * 
 * Requirements: 1.3 - WHEN a user selects a Subscription ID field THEN the 
 * Manual_Broadcast_System SHALL validate that the selected column exists 
 * in the uploaded file
 * 
 * @param selectedColumn - The column name selected by the user
 * @param fileColumns - Array of column names from the parsed file
 * @returns true if the selected column exists in the file columns
 */
export function validateSubscriptionIdColumn(
  selectedColumn: string,
  fileColumns: string[]
): boolean {
  if (!selectedColumn || selectedColumn.trim().length === 0) {
    return false;
  }
  
  if (!fileColumns || fileColumns.length === 0) {
    return false;
  }
  
  return fileColumns.includes(selectedColumn);
}
