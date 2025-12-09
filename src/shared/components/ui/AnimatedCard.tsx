import React, { useState } from "react";
import { LucideIcon } from "lucide-react";

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "elevated" | "glass" | "gradient";
  hover?: "lift" | "glow" | "scale" | "none";
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  rounded?: "md" | "lg" | "xl" | "2xl" | "3xl";
  border?: boolean;
  shadow?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  onClick?: () => void;
  icon?: LucideIcon;
  title?: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: "primary" | "secondary" | "success" | "warning" | "error";
  animateOnHover?: boolean;
}

export default function AnimatedCard({
  children,
  className = "",
  variant = "default",
  hover = "lift",
  padding = "md",
  rounded = "2xl",
  border = true,
  shadow = "sm",
  onClick,
  icon: Icon,
  title,
  subtitle,
  badge,
  badgeColor = "primary",
  animateOnHover = true,
}: AnimatedCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const baseClasses = `
    relative transition-all duration-500 ease-smooth cursor-pointer group
    ${onClick ? "cursor-pointer" : "cursor-default"}
    ${className}
  `;

  const variantClasses = {
    default: `
      bg-white ${border ? "border border-secondary-200" : ""} 
      ${
        animateOnHover && hover === "lift"
          ? "hover:shadow-xl hover:-translate-y-2"
          : ""
      }
      ${animateOnHover && hover === "glow" ? "hover:shadow-glow" : ""}
      ${animateOnHover && hover === "scale" ? "hover:scale-[1.03]" : ""}
    `,
    elevated: `
      bg-white shadow-lg ${border ? "border border-secondary-100" : ""}
      ${
        animateOnHover && hover === "lift"
          ? "hover:shadow-2xl hover:-translate-y-3"
          : ""
      }
      ${animateOnHover && hover === "glow" ? "hover:shadow-glow-lg" : ""}
      ${animateOnHover && hover === "scale" ? "hover:scale-[1.04]" : ""}
    `,
    glass: `
      backdrop-blur-xl bg-white/70 border border-white/20 shadow-lg
      ${
        animateOnHover && hover === "lift"
          ? "hover:bg-white/80 hover:-translate-y-2"
          : ""
      }
      ${animateOnHover && hover === "glow" ? "hover:shadow-glow" : ""}
      ${animateOnHover && hover === "scale" ? "hover:scale-[1.03]" : ""}
    `,
    gradient: `
      bg-gradient-to-br from-white via-primary-50/50 to-accent-50/50 
      border border-primary-100 shadow-md
      ${
        animateOnHover && hover === "lift"
          ? "hover:shadow-xl hover:-translate-y-2"
          : ""
      }
      ${animateOnHover && hover === "glow" ? "hover:shadow-glow" : ""}
      ${animateOnHover && hover === "scale" ? "hover:scale-[1.03]" : ""}
    `,
  };

  const paddingClasses = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
    xl: "p-10",
  };

  const roundedClasses = {
    md: "rounded-md",
    lg: "rounded-md",
    xl: "rounded-md",
    "2xl": "rounded-md",
    "3xl": "rounded-md",
  };

  const shadowClasses = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
    "2xl": "shadow-2xl",
  };

  const badgeColorClasses = {
    primary: "bg-primary-100 text-primary-800 border-primary-200",
    secondary: "bg-secondary-100 text-secondary-800 border-secondary-200",
    success: "bg-success-100 text-success-800 border-success-200",
    warning: "bg-warning-100 text-warning-800 border-warning-200",
    error: "bg-error-100 text-error-800 border-error-200",
  };

  return (
    <div
      className={`
        ${baseClasses} 
        ${variantClasses[variant]} 
        ${paddingClasses[padding]} 
        ${roundedClasses[rounded]} 
        ${shadowClasses[shadow]}
      `}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Pattern */}
      {variant === "gradient" && (
        <div className="absolute inset-0 bg-grid-pattern opacity-30 rounded-inherit" />
      )}

      {/* Header */}
      {(title || subtitle || badge || Icon) && (
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            {Icon && (
              <div
                className={`
                flex items-center justify-center w-12 h-12 rounded-md
                bg-gradient-to-br from-primary-100 to-accent-100
                transition-all duration-500 ease-smooth
                ${isHovered ? "scale-125 rotate-6 animate-bounce-subtle" : ""}
              `}
              >
                <Icon className="w-6 h-6 text-primary-600" />
              </div>
            )}
            <div>
              {title && (
                <h3 className="text-xl font-bold text-secondary-900 mb-1">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-secondary-600 text-sm">{subtitle}</p>
              )}
            </div>
          </div>

          {badge && (
            <span
              className={`
              inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold
              border transition-all duration-300
              ${badgeColorClasses[badgeColor]}
              ${isHovered ? "scale-105" : ""}
            `}
            >
              {badge}
            </span>
          )}
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>

      {/* Hover Overlay */}
      {animateOnHover && (
        <div
          className={`
          absolute inset-0 rounded-inherit transition-opacity duration-300
          bg-gradient-to-r from-primary-500/5 to-accent-500/5
          ${isHovered ? "opacity-100" : "opacity-0"}
        `}
        />
      )}

      {/* Animated Border */}
      {animateOnHover && hover === "glow" && (
        <div
          className={`
          absolute inset-0 rounded-inherit transition-opacity duration-300
          bg-gradient-to-r from-primary-500 to-accent-500 p-[1px]
          ${isHovered ? "opacity-20" : "opacity-0"}
        `}
        >
          <div className={`w-full h-full bg-white rounded-inherit`} />
        </div>
      )}
    </div>
  );
}
