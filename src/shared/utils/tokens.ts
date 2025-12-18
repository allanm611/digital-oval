export const colors = {
  // Primary defines main brand colors and key UI elements
  primary: {
    action: "#252829", // Main buttons, CTAs
    accent: "#00BBCC", // Interactive elements, highlights 4FDFF3
    background: "#e5e7eb", // Dashboard pages
  },

  // Surface defines background colors for containers and cards
  surface: {
    cards: "#F5F5F5", // Cards and table headers (neutral-100)
    background: "#FFFFFF",
    tableHeader: "#e5e7eb",
    // "linear-gradient(to bottom, #394247 0%, #1F2223 70%, #2A2F31 100%)",
    tableHeaderText: "#000000",
    // "#FFFFFF",
    tablebodybg: "#FFFFFF",
  },

  // Gradient colors for sidebar and header
  gradients: {
    sidebar: {
      top: "#2A2F31", // Custom blend - Dark with subtle light hint (top)
      middle: "#1F2223", // NEUTRAL 900 - Deep charcoal (middle)
      bottom: "#2A2F31", // Custom blend - Dark with subtle light hint (bottom)
    },
    landing: {
      top: "#22282A", // NEUTRAL 800 - Dark blue-gray (top)
      middleLight: "#394247", // NEUTRAL 700 - Dark blue-gray
      middle: "#5F6F77", // NEUTRAL 600 - Medium-dark blue-gray
      middleDark: "#394247", // NEUTRAL 700 - Back to dark blue-gray
      bottom: "#22282A", // NEUTRAL 800 - Dark blue-gray (bottom)
    },
  },

  // Status defines colors for different message types and states
  status: {
    success: "#94DF5A", // Success messages (Green 500)
    danger: "#FC9C9C", // Error messages (Coral 500)
    warning: "#F7B430", // Warning messages (Yellow 500)
    info: "#C38BFB", // Info messages (Purple 500)
  },

  // Tertiary tag colors for status indicators
  tertiary: {
    tag1: "#C38BFB", // Purple 500
    tag2: "#FC9C9C", // Coral 500
    tag3: "#F7B430", // Yellow 500
    tag4: "#15803d", // Green 700 - same as stat cards (bg-green-100 text-green-700)
    // Active tag colors matching stat cards (bg-green-100 text-green-700)
    active: {
      background: "#dcfce7", // green-100
      text: "#15803d", // green-700
    },
  },

  // Chart colors for distribution charts
  charts: {
    offers: {
      discount: "#C38BFB", // Purple 500
      cashback: "#FC9C9C", // Coral 500
      freeShipping: "#F7B430", // Yellow 500
      buyOneGetOne: "#94DF5A", // Green 500
      voucher: "#4FDFF3", // Cyan/Teal for voucher (different from discount)
    },
    segments: {
      dynamic: "#6B8E6B", // Lighter green (Green 600)
      static: "#B84A6B", // Lighter red/maroon (Red 600)
      trigger: "#A66B3D", // Lighter brown (Brown 600)
      hybrid: "#5B6870", // Lighter neutral (NEUTRAL 600)
    },
    campaigns: {
      active: "#94DF5A", // Green 500
      pending: "#FC9C9C", // Coral 500
      paused: "#F7B430", // Yellow 500
      completed: "#66E8FA", // Brand 400
      draft: "#6B7280", // Gray
      // Primary colors for charts
      primary: "#C38BFB", // Purple for main bars
      secondary: "#FC9C9C", // Coral for secondary elements
      accent: "#4FDFF3", // Cyan for accent elements
      // Pie chart colors for distribution charts
      pieColors: [
        "#C38BFB", // Purple (primary)
        "#FC9C9C", // Coral (pending)
        "#F7B430", // Yellow (paused)
        "#66E8FA", // Cyan (completed)
        "#6B7280", // Gray (draft)
        "#8b5cf6", // Purple accent
        "#4FDFF3", // Cyan
        "#94DF5A", // Green (fallback)
      ],
    },
    products: {
      // Color palette for product categories (rotating colors)
      color1: "#C38BFB", // Purple
      color2: "#FC9C9C", // Coral
      color3: "#F7B430", // Yellow
      color4: "#94DF5A", // Green
      color5: "#4FDFF3", // Cyan
      color6: "#6B8E6B", // Green 600
      color7: "#B84A6B", // Red 600
      color8: "#A66B3D", // Brown 600
      color9: "#5B6870", // Neutral 600
      color10: "#66E8FA", // Brand 400
    },
    scheduledJobs: {
      // Primary green for scheduled jobs analytics charts
      primary: "#3b8169", // Main green for bars and primary elements
      secondary: "#10b981", // Lighter green for secondary bars
      accent: "#8b5cf6", // Purple for accent elements (owner distribution)
      execution: "#4FDFF3", // Cyan for execution counts
      performance: "#C38BFB", // Purple for performance metrics
      // Pie chart colors for status distribution
      pieColors: [
        "#3b8169", // Primary green
        "#10b981", // Light green
        "#f59e0b", // Amber/yellow
        "#ef4444", // Red
        "#6366f1", // Indigo
        "#8b5cf6", // Purple
      ],
    },
    communications: {
      // Primary colors for communications analytics charts
      primary: "#3B82F6", // Blue for main bars and primary elements
      secondary: "#10B981", // Green for secondary bars
      accent: "#8B5CF6", // Purple for accent elements
      success: "#059669", // Dark green for success metrics
      error: "#DC2626", // Red for error/failure metrics
      warning: "#D97706", // Orange for warning states
      // Pie chart colors for channel distribution
      pieColors: [
        "#3B82F6", // Blue (primary)
        "#10B981", // Green (success)
        "#F59E0B", // Yellow (warning)
        "#8B5CF6", // Purple (accent)
        "#DC2626", // Red (error)
        "#06B6D4", // Cyan (secondary)
        "#84CC16", // Lime (additional)
      ],
      // Area chart gradient colors
      sentGradient: ["#3B82F6", "#1E40AF"], // Blue gradient for sent messages
      failedGradient: ["#DC2626", "#B91C1C"], // Red gradient for failed messages
    },
  },

  // Standardized report chart colors - 4 color palette for all report graphs
  reportCharts: {
    // Base color palette (use these 6 colors across all report graphs)
    palette: {
      color1: "#00505C", // Dark teal
      color2: "#C38BFB", // Purple (was dark gray)
      color3: "#92A6B0", // Light gray-blue
      color4: "#4FDFF3", // Cyan/light blue
      color5: "#FC9C9C", // Light pink/coral (for lifecycle distribution)
      color6: "#F7B430", // Orange/amber (for lifecycle distribution)
    },

    // Customer Profile Reports
    customerProfile: {
      valueMatrix: {
        customers: "#4FDFF3", // color4 - lighter for single bar
      },
      clvDistribution: {
        customers: "#4FDFF3", // color4 (bar) - lighter
        revenueShare: "#92A6B0", // color3 (line)
      },
      lifecycleDistribution: {
        active: "#4FDFF3", // color4 - cyan
        new: "#92A6B0", // color3 - light gray-blue
        reactivated: "#00505C", // color1 - dark teal
        atRisk: "#C38BFB", // color2 - purple
        dormant: "#FC9C9C", // color5 - light pink/coral
        churned: "#F7B430", // color6 - orange/amber
      },
      cohortRetention: {
        jan: "#4FDFF3", // color4 - lighter for multi-bar
        apr: "#92A6B0", // color3 - lighter
        jul: "#00505C", // color1 - dark teal
      },
    },

    // Offer Reports
    offerReports: {
      redemptionFunnel: {
        value: "#4FDFF3", // color4 - lighter for single bar
      },
      redemptionTimeline: {
        redemptions: "#4FDFF3", // color4 - lighter
        cumulative: "#92A6B0", // color3
      },
      offerTypeComparison: {
        redemptionRate: "#4FDFF3", // color4 - lighter for multi-bar
        avgTransactionValue: "#92A6B0", // color3 - lighter
      },
    },

    // Campaign Reports
    campaignReports: {
      channelReach: {
        reach: "#4FDFF3", // color4 - lighter for multi-bar
        impressions: "#92A6B0", // color3 - lighter
      },
      engagementStages: {
        value: "#4FDFF3", // color4 - lighter for single bar
      },
      ctrEngagementTrends: {
        ctr: "#4FDFF3", // color4 - lighter
        engagement: "#92A6B0", // color3
      },
      revenueVsSpend: {
        revenue: "#4FDFF3", // color4 - lighter
        spend: "#92A6B0", // color3 - lighter
      },
    },

    // Delivery SMS Reports
    deliverySMS: {
      smsDelivery: {
        sent: "#4FDFF3", // color4 - lighter for multi-bar
        delivered: "#92A6B0", // color3 - lighter
        converted: "#00505C", // color1 - dark teal
      },
    },

    // Delivery Email Reports
    deliveryEmail: {
      emailDelivery: {
        sent: "#4FDFF3", // color4 - lighter for multi-bar
        delivered: "#92A6B0", // color3 - lighter
        converted: "#00505C", // color1 - dark teal
      },
    },

    // Overall Dashboard Performance
    overallPerformance: {
      channelPerformance: {
        clicks: "#4FDFF3", // color4 - lighter for multi-bar
        conversions: "#92A6B0", // color3 - lighter
        ctr: "#00505C", // color1 (line) - dark teal
        cvr: "#C38BFB", // color2 (line) - purple
      },
      smsDelivery: {
        sent: "#4FDFF3", // color4 - lighter for multi-bar
        delivered: "#92A6B0", // color3 - lighter
        converted: "#00505C", // color1 - dark teal
      },
      timeSeriesTrends: {
        reach: "#4FDFF3", // color4 - lighter for multi-bar
        clicks: "#92A6B0", // color3 - lighter
        conversions: "#00505C", // color1 - dark teal
        revenue: "#C38BFB", // color2 (line) - purple
      },
    },
  },

  // Configuration status colors
  configStatus: {
    active: "#C38BFB", // Purple 500 - Active
    inactive: "#FC9C9C", // Coral 500 - Inactive
    draft: "#F7B430", // Yellow 500 - Draft
    default: "#94DF5A", // Green 500 - Default
  },

  // Text defines all text color variations for different content types
  text: {
    primary: "#000000", // Main headings, important text
    secondary: "#394247", // Body text, descriptions
    muted: "#6B7280", // Placeholders, disabled text
    inverse: "#FFFFFF", // Text on dark buttons/backgrounds
  },

  // Icon sizes for consistent iconography
  iconSizes: {
    xs: "w-3 h-3", // Extra small icons (12px)
    sm: "w-4 h-4", // Small icons (16px)
    lg: "w-6 h-6", // Large icons (24px)
  },

  // Interactive defines colors for user interaction states
  interactive: {
    hover: "#F3F4F6", // Hover states
    active: "#E5E7EB", // Active states
    focus: "#4FDFF3", // Focus states
    disabled: "#D1D5DB", // Disabled states
    link: "#2563EB", // Link color (blue-600)
  },

  // Border defines colors for different border types and emphasis
  border: {
    default: "#E5E7EB", // Default borders
    accent: "#4FDFF3", // Accent borders
    muted: "#F3F4F6", // Subtle borders
  },
};

export const fonts = {
  // Primary font for main headings - Satoshi Variable
  primary: {
    name: "Satoshi Variable",
    fallback:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },

  // Secondary font for sub-headings - Using Impact as primary (Et Mono fallback not available)
  secondary: {
    name: "Impact",
    fallback:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
  },

  // Tertiary font for card headings - sans-serif
  tertiary: {
    name: "sans-serif",
    fallback:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },

  weights: {
    normal: 400,
    medium: 500,
    bold: 700,
    extraBold: 800, // For main headings
  },

  sizes: {
    caption: "0.75rem",
    small: "0.875rem",
    body: "1rem",
    bodyLg: "1.125rem",
    h6: "1rem",
    h5: "1.125rem",
    h4: "1.25rem",
    h3: "1.5rem",
    h2: "1.875rem",
    h1: "2.25rem",
    displaySm: "3rem",
    displayMd: "3.75rem",
    displayLg: "4.5rem",
    // New sizes for typography system
    mainHeading: "5.472rem", // 87.552px
    subHeading: "1.0944rem", // 17.5104px
  },

  typography: {
    // Main Headings use Satoshi Variable with weight 800
    mainHeading: {
      size: "5.472rem", // 87.552px
      weight: 800, // Extra bold
      family: "primary",
      lineHeight: "110%",
      letterSpacing: "-4%",
      fontKerning: "normal",
    },
    // Sub-headings use Impact with weight 400
    subHeading: {
      size: "1.0944rem", // 17.5104px
      weight: 400, // Normal weight
      family: "secondary",
      lineHeight: "normal",
      letterSpacing: "-8%", // -3px equivalent but percentage-based for responsiveness
      fontKerning: "normal",
    },
    heading: {
      size: "1.875rem",
      weight: 800, // Updated to extra bold to match main headings
      family: "primary",
      lineHeight: "120%",
      letterSpacing: "-4%",
    },
    subtitle: {
      size: "1.25rem",
      weight: 400, // Updated to match sub-headings
      family: "secondary",
      lineHeight: "120%",
      letterSpacing: "-8%",
    },
    cardTitle: {
      size: "1.25rem",
      weight: 500,
      family: "primary",
      lineHeight: "120%",
      letterSpacing: "-4%",
    },
    // Card headings use sans-serif
    cardHeading: {
      size: "1.125rem", // 18px
      weight: 600, // Semi-bold weight
      family: "sans-serif", // System sans-serif font
      lineHeight: "normal",
      letterSpacing: "0%",
    },
    // Card sub-headings use sans-serif
    cardSubHeading: {
      size: "0.875rem", // 14px
      weight: 400, // Normal weight
      family: "sans-serif", // System sans-serif font
      lineHeight: "normal",
      letterSpacing: "0%",
    },
    // Body text uses secondary font with variable line heights
    body: {
      size: "1rem",
      weight: 400,
      family: "secondary",
      lineHeight: "130%",
      letterSpacing: "0%",
    },
    bodyShort: {
      size: "1rem",
      weight: 400,
      family: "secondary",
      lineHeight: "120%",
      letterSpacing: "0%",
    },
    bodyLong: {
      size: "1rem",
      weight: 400,
      family: "secondary",
      lineHeight: "160%",
      letterSpacing: "0%",
    },
    caption: {
      size: "0.875rem",
      weight: 400,
      family: "secondary",
      lineHeight: "130%",
      letterSpacing: "0%",
    },
    button: {
      size: "1rem",
      weight: 500, // Medium for buttons
      family: "primary",
      lineHeight: "130%",
      letterSpacing: "0%",
    },
    label: {
      size: "0.875rem",
      weight: 400, // Normal for labels
      family: "secondary",
      lineHeight: "120%",
      letterSpacing: "0%",
    },
  },
};

export const spacing = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
  "2xl": "3rem",
  "3xl": "4rem",
  "4xl": "6rem",
  "5xl": "8rem",
};

export const borderRadius = {
  none: "0",
  sm: "0.125rem",
  base: "0.25rem",
  md: "0.375rem",
  lg: "0.5rem",
  xl: "0.75rem",
  "2xl": "1rem",
  "3xl": "1.5rem",
  full: "9999px",
};

// Button defines consistent sizing, padding, and border radius for all buttons
// All buttons use: paddingY: 0.625rem (py-2.5), paddingX: 1rem (px-4), borderRadius: 0.375rem (rounded-md), fontSize: 0.875rem (text-sm)
export const buttons = {
  action: {
    background: colors.primary.action,
    color: "#FFFFFF", // White text on dark buttons
    border: "none",
    paddingY: "0.625rem", // py-2.5
    paddingX: "1rem", // px-4
    borderRadius: "0.375rem", // rounded-md
    fontSize: "0.875rem", // text-sm (14px)
  },

  secondaryAction: {
    background: "#F5FCFF",
    color: "#000000",
    border: "none",
    paddingY: "0.625rem", // py-2.5
    paddingX: "1rem", // px-4
    borderRadius: "0.375rem", // rounded-md
    fontSize: "0.875rem", // text-sm (14px)
  },

  accentActionbutton: {
    background: "#00BBCC",
    color: "#FFFFFF",
    border: "none",
    paddingY: "0.625rem", // py-2.5
    paddingX: "1rem", // px-4
    borderRadius: "0.375rem", // rounded-md
    fontSize: "0.875rem", // text-sm (14px)
  },

  bordered: {
    background: "transparent",
    color: colors.primary.action,
    border: `1px solid ${colors.primary.action}`,
    paddingY: "0.625rem", // py-2.5
    paddingX: "1rem", // px-4
    borderRadius: "0.375rem", // rounded-md
    fontSize: "0.875rem", // text-sm (14px)
  },

  delete: {
    background: "#DC2626", // bg-red-600
    color: "#FFFFFF",
    border: "none",
    paddingY: "0.625rem", // py-2.5
    paddingX: "1rem", // px-4
    borderRadius: "0.375rem", // rounded-md
    fontSize: "0.875rem", // text-sm (14px)
  },

  activeIconDisplay: {
    background: colors.primary.accent, // Accent color background
    color: "#FFFFFF", // White text
    border: "none",
    paddingY: "0.625rem", // py-2.5
    paddingX: "1rem", // px-4
    borderRadius: "0.375rem", // rounded-md
    fontSize: "0.875rem", // text-sm
  },
};

// Cards defines consistent styling for all card components
export const cards = {
  default: {
    background: colors.surface.cards,
    border: "1px solid",
    borderColor: "#374151",
    borderRadius: "1rem",
    padding: "1.5rem",
  },
};

// Reusable note/banner styling tokens to avoid hardcoded colors
export const notes = {
  warning: {
    background: "#FFFBEB", // amber-50
    border: "#FCD34D", // amber-300
    text: "#92400E", // amber-700
    textLight: "#B45309", // slightly lighter amber for softer text
  },
};

// Z-Index system for consistent layering across the platform
// Use these values instead of hardcoded z-index numbers
export const zIndex = {
  // Base layer - default stacking context
  base: 0,

  // Dropdowns and select menus (HeadlessUI, custom dropdowns)
  dropdown: 1000,

  // Sticky elements (headers, navigation bars)
  sticky: 1100,

  // Fixed elements (sidebars, fixed headers)
  fixed: 1200,

  // Overlay/backdrop (modal backgrounds, dimmers)
  overlay: 2000,

  // Modals and dialogs (should be above overlays)
  modal: 3000,

  // Popovers and tooltips (contextual UI that appears above modals)
  popover: 4000,

  // Notifications and toasts (should always be visible)
  notification: 5000,

  // Maximum priority (use sparingly, only for critical UI)
  max: 9999,
};
