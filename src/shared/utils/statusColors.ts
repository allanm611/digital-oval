import type React from "react";

/**
 * Centralized status color mappings for consistent UI across all features.
 * Supports both Tailwind classes and custom hex colors.
 */

const COLOR_PALETTE = {
  GREEN: "#1E382D", // Approved/Active green
  RED: "#730F07", // Rejected red
  YELLOW: "#ACAC0C", // Pending/Paused yellow
  GRAY_LIGHT: "#F3F4F6", // Draft gray
  GRAY_DARK: "#374151", // Archived gray
  BLUE: "#1E40AF", // Completed blue
  WHITE: "#FFFFFF",
};

interface StatusColorConfig {
  bg?: string;
  text?: string;
  border?: string;
  bgHex?: string;
  textHex?: string;
  borderHex?: string;
}

// Campaign and offer workflow statuses
const WORKFLOW_STATUS_COLORS: Record<string, StatusColorConfig> = {
  active: {
    bgHex: COLOR_PALETTE.GREEN,
    textHex: COLOR_PALETTE.WHITE,
    borderHex: COLOR_PALETTE.GREEN,
  },
  paused: {
    bgHex: COLOR_PALETTE.YELLOW,
    textHex: "#000000",
    borderHex: COLOR_PALETTE.YELLOW,
  },
  draft: {
    bgHex: "#92A6B0",
    textHex: COLOR_PALETTE.WHITE,
    borderHex: "#92A6B0",
  },
  completed: {
    bgHex: COLOR_PALETTE.BLUE,
    textHex: COLOR_PALETTE.WHITE,
    borderHex: COLOR_PALETTE.BLUE,
  },
  archived: {
    bgHex: COLOR_PALETTE.GRAY_DARK,
    textHex: COLOR_PALETTE.WHITE,
    borderHex: COLOR_PALETTE.GRAY_DARK,
  },
  rejected: {
    bgHex: COLOR_PALETTE.RED,
    textHex: COLOR_PALETTE.WHITE,
    borderHex: COLOR_PALETTE.RED,
  },
};

// Approval workflow statuses (for campaigns, offers, etc.)
const APPROVAL_STATUS_COLORS: Record<string, StatusColorConfig> = {
  approved: {
    bgHex: COLOR_PALETTE.GREEN,
    textHex: COLOR_PALETTE.WHITE,
    borderHex: COLOR_PALETTE.GREEN,
  },
  rejected: {
    bgHex: COLOR_PALETTE.RED,
    textHex: COLOR_PALETTE.WHITE,
    borderHex: COLOR_PALETTE.RED,
  },
  pending: {
    bgHex: COLOR_PALETTE.YELLOW,
    textHex: "#000000",
    borderHex: COLOR_PALETTE.YELLOW,
  },
  pending_approval: {
    bgHex: COLOR_PALETTE.YELLOW,
    textHex: "#000000",
    borderHex: COLOR_PALETTE.YELLOW,
  },
};

// Job execution statuses
const JOB_STATUS_COLORS: Record<string, StatusColorConfig> = {
  completed: {
    bgHex: COLOR_PALETTE.GREEN,
    textHex: COLOR_PALETTE.WHITE,
    borderHex: COLOR_PALETTE.GREEN,
  },
  running: {
    bgHex: COLOR_PALETTE.BLUE,
    textHex: COLOR_PALETTE.WHITE,
    borderHex: COLOR_PALETTE.BLUE,
  },
  failed: {
    bgHex: COLOR_PALETTE.RED,
    textHex: COLOR_PALETTE.WHITE,
    borderHex: COLOR_PALETTE.RED,
  },
  pending: {
    bgHex: COLOR_PALETTE.YELLOW,
    textHex: "#000000",
    borderHex: COLOR_PALETTE.YELLOW,
  },
};

// User and account statuses
const ACCOUNT_STATUS_COLORS: Record<string, StatusColorConfig> = {
  active: {
    bgHex: COLOR_PALETTE.GREEN,
    textHex: COLOR_PALETTE.WHITE,
    borderHex: COLOR_PALETTE.GREEN,
  },
  inactive: {
    bgHex: COLOR_PALETTE.GRAY_LIGHT,
    textHex: COLOR_PALETTE.GRAY_DARK,
    borderHex: COLOR_PALETTE.GRAY_LIGHT,
  },
  suspended: {
    bgHex: COLOR_PALETTE.RED,
    textHex: COLOR_PALETTE.WHITE,
    borderHex: COLOR_PALETTE.RED,
  },
  pending: {
    bgHex: COLOR_PALETTE.YELLOW,
    textHex: "#000000",
    borderHex: COLOR_PALETTE.YELLOW,
  },
};

// Default fallback color
const DEFAULT_COLOR: StatusColorConfig = {
  bg: "bg-gray-100",
  text: "text-gray-800",
};

/**
 * Convert color config to Tailwind classes (or empty string if hex colors used)
 */
const configToTailwind = (config: StatusColorConfig): string => {
  if (config.bgHex || config.textHex || config.borderHex) {
    return ""; // Use inline styles instead
  }
  return `${config.bg || ""} ${config.text || ""} ${config.border || ""}`.trim();
};

/**
 * Get status color for workflow statuses (active, paused, draft, completed, archived)
 */
export const getWorkflowStatusColor = (status?: string): string => {
  if (!status) return `${DEFAULT_COLOR.bg} ${DEFAULT_COLOR.text}`;
  const config = WORKFLOW_STATUS_COLORS[status.toLowerCase()];
  if (!config) return `${DEFAULT_COLOR.bg} ${DEFAULT_COLOR.text}`;
  return configToTailwind(config) || `${config.bg} ${config.text}`;
};

/**
 * Get status color for approval statuses (approved, rejected, pending)
 * For hex colors, use getStatusColorConfig() and apply as inline style
 */
export const getApprovalStatusColor = (status?: string): string => {
  if (!status) return `${DEFAULT_COLOR.bg} ${DEFAULT_COLOR.text} ${DEFAULT_COLOR.border || ""}`.trim();
  const config = APPROVAL_STATUS_COLORS[status.toLowerCase()];
  if (!config) return `${DEFAULT_COLOR.bg} ${DEFAULT_COLOR.text} ${DEFAULT_COLOR.border || ""}`.trim();

  if (config.bgHex || config.textHex) {
    return ""; // Return empty string when using hex colors
  }
  return `${config.bg || ""} ${config.text || ""} ${config.border || ""}`.trim();
};

/**
 * Get status color for job execution statuses
 */
export const getJobStatusColor = (status?: string): string => {
  if (!status) return `${DEFAULT_COLOR.bg} ${DEFAULT_COLOR.text}`;
  const config = JOB_STATUS_COLORS[status.toLowerCase()];
  if (!config) return `${DEFAULT_COLOR.bg} ${DEFAULT_COLOR.text}`;
  return `${config.bg} ${config.text}`;
};

/**
 * Get status color for account statuses
 */
export const getAccountStatusColor = (status?: string): string => {
  if (!status) return `${DEFAULT_COLOR.bg} ${DEFAULT_COLOR.text}`;
  const config = ACCOUNT_STATUS_COLORS[status.toLowerCase()];
  if (!config) return `${DEFAULT_COLOR.bg} ${DEFAULT_COLOR.text}`;
  return `${config.bg} ${config.text}`;
};

/**
 * Get individual color components (for custom styling with inline styles)
 */
export const getStatusColorConfig = (status?: string, type: "workflow" | "approval" | "job" | "account" = "workflow"): StatusColorConfig => {
  const maps = {
    workflow: WORKFLOW_STATUS_COLORS,
    approval: APPROVAL_STATUS_COLORS,
    job: JOB_STATUS_COLORS,
    account: ACCOUNT_STATUS_COLORS,
  };

  if (!status) return DEFAULT_COLOR;
  return maps[type][status.toLowerCase()] || DEFAULT_COLOR;
};

/**
 * Get inline style object from status (useful for custom hex colors)
 */
export const getStatusStyle = (status?: string, type: "workflow" | "approval" | "job" | "account" = "workflow"): React.CSSProperties => {
  const config = getStatusColorConfig(status, type);
  const style: React.CSSProperties = {};

  if (config.bgHex) {
    style.backgroundColor = config.bgHex;
  }
  if (config.textHex) {
    style.color = config.textHex;
  }
  if (config.borderHex) {
    style.borderColor = config.borderHex;
  }

  return style;
};

/**
 * Get both Tailwind classes and inline styles for a status
 * Returns object with className (for Tailwind) and style (for hex colors)
 */
export const getStatusBadgeConfig = (status?: string, type: "workflow" | "approval" | "job" | "account" = "workflow"): { className: string; style: React.CSSProperties } => {
  if (!status) return { className: "", style: {} };

  const config = getStatusColorConfig(status, type);
  const style: React.CSSProperties = {};

  // Apply hex colors as inline styles
  if (config.bgHex) {
    style.backgroundColor = config.bgHex;
  }
  if (config.textHex) {
    style.color = config.textHex;
  }
  if (config.borderHex) {
    style.borderColor = config.borderHex;
  }

  // Apply Tailwind classes
  const tailwindClasses = `${config.bg || ""} ${config.text || ""} ${config.border || ""}`.trim();

  return {
    className: tailwindClasses,
    style: style,
  };
};

/**
 * Export color palette for reference and potential reuse
 * To change all status colors globally, modify the COLOR_PALETTE object above
 */
export { COLOR_PALETTE };
