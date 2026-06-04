//converts the tokens into usable tailwind classes
import {
  colors,
  fonts,
  spacing,
  borderRadius,
  buttons,
  zIndex,
  notes,
} from "./tokens";

// Standardized rounded corners - use this constant instead of hardcoded "rounded-md"
export const ROUNDED = "rounded-md";

const themedColor = {
  primary: {
    action: "var(--c-primary-action)",
    accent: "var(--c-primary-accent)",
    background: "var(--c-primary-background)",
  },
  surface: {
    cards: "var(--c-surface-cards)",
    background: "var(--c-surface-background)",
    tableHeader: "var(--c-surface-table-header)",
    tableHeaderText: "var(--c-surface-table-header-text)",
    tablebodybg: "var(--c-surface-table-body)",
  },
  text: {
    primary: "var(--c-text-primary)",
    secondary: "var(--c-text-secondary)",
    muted: "var(--c-text-muted)",
    inverse: "var(--c-text-inverse)",
  },
  interactive: {
    hover: "var(--c-interactive-hover)",
    active: "var(--c-interactive-active)",
    focus: "var(--c-interactive-focus)",
    disabled: "var(--c-interactive-disabled)",
    link: "var(--c-interactive-link)",
  },
  border: {
    default: "var(--c-border-default)",
    accent: "var(--c-border-accent)",
    muted: "var(--c-border-muted)",
  },
  notes: {
    warning: {
      background: "var(--c-note-warning-bg)",
      border: "var(--c-note-warning-border)",
      text: "var(--c-note-warning-text)",
      textLight: "var(--c-note-warning-text-light)",
    },
  },
};

const themedButtons = {
  ...buttons,
  action: {
    ...buttons.action,
    background: "var(--c-primary-action)",
  },
  bordered: {
    ...buttons.bordered,
    color: "var(--c-primary-action)",
    border: "1px solid var(--c-primary-action)",
  },
};

// Direct access to color values from tokens.ts - use these for custom styling
export const color = {
  primary: themedColor.primary,
  surface: themedColor.surface,
  status: colors.status,
  configStatus: colors.configStatus,
  tertiary: colors.tertiary,
  charts: colors.charts,
  text: themedColor.text,
  interactive: themedColor.interactive,
  border: themedColor.border,
  gradients: colors.gradients,
  iconSizes: colors.iconSizes,
  notes: themedColor.notes,
};

// Font system with Satoshi and sans-serif - includes weights, sizes, and pre-defined typography styles
export const typography = {
  primary: fonts.primary.name,
  secondary: fonts.secondary.name,
  weights: fonts.weights,
  sizes: fonts.sizes,
  semantic: fonts.typography,
};

// Spacing and border radius values for consistent layout and rounded corners
export const space = spacing;
export const radius = borderRadius;
export const button = themedButtons;
export { zIndex };
export const zIndexTokens = zIndex;

// Utility function to convert button tokens to CSS style object
export const getButtonStyles = (buttonToken: typeof buttons.action) => ({
  background: buttonToken.background,
  color: buttonToken.color,
  paddingTop: buttonToken.paddingY,
  paddingBottom: buttonToken.paddingY,
  paddingLeft: buttonToken.paddingX,
  paddingRight: buttonToken.paddingX,
  borderRadius: buttonToken.borderRadius,
  fontSize: buttonToken.fontSize,
  border: buttonToken.border,
  cursor: "pointer",
});

// Note/banner styles to avoid hardcoded colors
export const noteStyles = {
  warning: {
    backgroundColor: color.notes.warning.background,
    borderColor: color.notes.warning.border,
    textColor: color.notes.warning.textLight,
  },
};

// Ready-to-use Tailwind CSS classes - copy and paste these directly into your className props
export const tw = {
  primaryAction: "bg-[var(--c-primary-action)] text-white",
  primaryAccent: "bg-[var(--c-primary-accent)] text-black",
  primaryBackground: "bg-[var(--c-primary-background)]",

  // Accent color with opacity variants
  accent10: `bg-[${colors.primary.accent}]/10`,
  accent20: `bg-[${colors.primary.accent}]/20`,
  accent30: `bg-[${colors.primary.accent}]/30`,
  accent50: `bg-[${colors.primary.accent}]/50`,

  surfaceCards: "bg-[var(--c-surface-cards)]",
  surfaceBackground: "bg-[var(--c-surface-background)]",
  tableHeader: "bg-[var(--c-surface-table-header)]",
  bgTabActive: "bg-[var(--c-bg-tab-active)]",
  bgTabInactive: "bg-[var(--c-bg-tab-inactive)]",

  success: `text-[${colors.status.success}]`,
  danger: "text-[var(--c-text-danger)]",
  warning: `text-[${colors.status.warning}]`,
  info: `text-[${colors.status.info}]`,

  // Status background colors with opacity variants
  statusSuccess: `bg-[${colors.status.success}]`,
  statusDanger: `bg-[${colors.status.danger}]`,
  statusWarning: `bg-[${colors.status.warning}]`,
  statusInfo: `bg-[${colors.status.info}]`,

  statusSuccess10: `bg-[${colors.status.success}]/10`,
  statusDanger10: `bg-[${colors.status.danger}]/10`,
  statusWarning10: `bg-[${colors.status.warning}]/10`,
  statusInfo10: `bg-[${colors.status.info}]/10`,

  textPrimary: "text-[var(--c-text-primary)]",
  textSecondary: "text-[var(--c-text-secondary)]",
  textMuted: "text-[var(--c-text-muted)]",
  textInverse: "text-[var(--c-text-inverse)]",
  textSuccess: "text-[var(--c-text-success)]",
  textDanger: "text-[var(--c-text-danger)]",
  textLight: "text-white",
  textAction: "text-white",

  hover: "hover:bg-[var(--c-interactive-hover)]",
  active: "active:bg-[var(--c-interactive-active)]",
  focus: "focus:ring-[var(--c-interactive-focus)]",
  disabled: "disabled:bg-[var(--c-interactive-disabled)]",
  link: "text-[var(--c-interactive-link)]",

  borderDefault: "border-[var(--c-border-default)]",
  borderAccent: "border-[var(--c-border-accent)]",
  borderMuted: "border-[var(--c-border-muted)]",
  borderLight: "border-[var(--c-border-light)]",

  fontPrimary: "font-sans",
  fontSecondary: "font-mono",

  // Typography classes using Satoshi Variable and Impact fonts
  // Main headings - Satoshi Variable, weight 800, 87.552px, line-height 110%, letter-spacing -4%
  mainHeading: `font-['Satoshi_Variable',sans-serif] text-[2rem] font-[800] leading-[110%] tracking-[-0.04em]`,
  // Sub-headings - sans-serif, weight 400, 17.5104px, letter-spacing -8%
  subHeading: `font-sans text-[1.0944rem] font-normal leading-normal tracking-[-0.08em]`,
  // Card headings - sans-serif, weight 600, 18px
  cardHeading: `font-sans text-[1.125rem] font-semibold leading-normal`,
  // Card sub-headings - sans-serif, weight 400, 14px
  cardSubHeading: `font-sans text-[0.875rem] font-normal leading-normal`,

  // Table first column (name/title) - text-sm, semibold
  tableFirstColumn: `text-sm font-semibold`,

  // Legacy typography classes (for backward compatibility)
  heading: "text-3xl font-bold leading-[120%] tracking-[-0.04em]",
  subtitle: "text-xl font-medium leading-[120%] tracking-[-0.08em]",
  cardTitle: "text-lg font-medium leading-[120%] tracking-[-0.02em]",
  body: "text-base font-normal leading-[130%] tracking-[0.01em]",
  bodyLong: "text-base font-normal leading-[160%] tracking-[0.01em]",
  bodyShort: "text-base font-normal leading-[120%] tracking-[0.01em]",
  caption: "text-sm font-normal leading-[130%] tracking-[0.02em]",
  buttonText: "text-sm font-medium leading-[130%] tracking-[0.02em]",
  label: "text-xs font-medium leading-[120%] tracking-[0.05em] uppercase",

  // Standardized rounded corners - use this instead of hardcoded rounded-md
  rounded: ROUNDED,

  button: `bg-[var(--c-primary-action)] text-white text-sm font-medium transition-colors px-4 py-2.5 ${ROUNDED} cursor-pointer`,

  // Bordered button with transparent background and colored border
  // Use with inline styles: style={{ borderColor: color.primary.action, color: color.primary.action }}
  borderedButton: `px-4 py-2.5 text-sm font-medium ${ROUNDED} border transition-colors bg-transparent hover:text-white`,
};

// Complete component styles - pre-built styles for common UI elements that you can use directly
export const components = {
  card: {
    default: `bg-[var(--c-surface-cards)] border border-[var(--c-border-default)] ${ROUNDED} p-6`,
    surface: `bg-[var(--c-surface-background)] border border-[var(--c-border-default)] ${ROUNDED} p-6`,
    elevated: `bg-[var(--c-surface-cards)] border border-[var(--c-border-default)] ${ROUNDED} p-6`,
  },

  input: {
    default: `border border-[var(--c-border-default)] focus:border-[var(--c-interactive-focus)] bg-[var(--c-surface-background)] text-[var(--c-text-primary)] ${ROUNDED}`,
    error: `border border-[${colors.status.danger}] focus:border-[${colors.status.danger}] bg-[var(--c-surface-background)] text-[var(--c-text-primary)] ${ROUNDED}`,
    accent: `border border-[var(--c-border-accent)] focus:border-[var(--c-border-accent)] bg-[var(--c-surface-background)] text-[var(--c-text-primary)] ${ROUNDED}`,
  },

  badge: {
    success: `bg-[${colors.status.success}]/10 text-[${colors.status.success}] px-2 py-1 ${ROUNDED} text-sm font-medium`,
    danger: `bg-[${colors.status.danger}]/10 text-[${colors.status.danger}] px-2 py-1 ${ROUNDED} text-sm font-medium`,
    warning: `bg-[${colors.status.warning}]/10 text-[${colors.status.warning}] px-2 py-1 ${ROUNDED} text-sm font-medium`,
    info: `bg-[${colors.status.info}]/10 text-[${colors.status.info}] px-2 py-1 ${ROUNDED} text-sm font-medium`,
    accent: `bg-[${colors.primary.accent}]/10 text-[${colors.primary.accent}] px-2 py-1 ${ROUNDED} text-sm font-medium`,
  },
};

// Helper functions for dynamic component styling - use these when you need to conditionally apply styles
export const helpers = {
  badge: (variant: "success" | "danger" | "warning" | "info" | "accent") => {
    return components.badge[variant];
  },
};

export default {
  color,
  typography,
  space,
  radius,
  button,
  tw,
  components,
  helpers,
};
