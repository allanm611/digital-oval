import React, { useState } from "react";
import { LucideIcon } from "lucide-react";
import { tw, color } from "../../utils/utils";

interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "success" | "warning" | "error";
  size?: "sm" | "md" | "lg";
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
  fullWidth?: boolean;
  glowEffect?: boolean;
}

export default function AnimatedButton({
  children,
  onClick,
  variant = "primary",
  size = "md",
  icon: Icon,
  iconPosition = "right",
  disabled = false,
  loading = false,
  className = "",
  type = "button",
  fullWidth = false,
  glowEffect = false,
}: AnimatedButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const baseClasses = `
    relative inline-flex items-center justify-center font-semibold ${tw.rounded}
    transition-all duration-300 ease-smooth focus-visible:outline-none 
    disabled:pointer-events-none disabled:opacity-50 overflow-hidden group transform-gpu
    ${fullWidth ? "w-full" : ""}
    ${isPressed ? "scale-95" : "hover:animate-bounce-slow"}
    ${className}
  `;

  const variantClasses = {
    // ALL BUTTONS use your logo green - consistent branding!
    primary: `
      ${tw.primaryButton}
      shadow-lg hover:shadow-xl hover:shadow-[${color.primary.action}]/25
      ${glowEffect ? "hover:shadow-glow" : ""}
    `,
    secondary: `
      ${tw.secondaryButton}
      shadow-sm hover:shadow-md
    `,
    ghost: `
      ${tw.ghostButton}
    `,
    // Status buttons use our harmonious status colors
    success: `
      bg-[${color.status.success}] hover:bg-[${color.status.success}] 
      text-white font-medium transition-colors
      shadow-lg hover:shadow-xl hover:shadow-[${color.status.success}]/25
    `,
    warning: `
      bg-[${color.status.warning}] hover:bg-[${color.status.warning}] 
      text-white font-medium transition-colors
      shadow-lg hover:shadow-xl hover:shadow-[${color.status.warning}]/25
    `,
    error: `
      bg-[${color.status.danger}] hover:bg-[${color.status.danger}] 
      text-white font-medium transition-colors
      shadow-lg hover:shadow-xl hover:shadow-[${color.status.danger}]/25
    `,
  };

  const sizeClasses = {
    sm: "px-4 py-2 text-sm gap-2",
    md: "px-6 py-3 text-base gap-2",
    lg: "px-8 py-4 text-lg gap-3",
  };

  const handleMouseDown = () => setIsPressed(true);
  const handleMouseUp = () => setIsPressed(false);
  const handleMouseLeave = () => setIsPressed(false);

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {/* Loading spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Button content */}
      <span
        className={`flex items-center gap-2 ${
          loading ? "opacity-0" : "opacity-100"
        }`}
      >
        {Icon && iconPosition === "left" && (
          <Icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
        )}
        {children}
        {Icon && iconPosition === "right" && (
          <Icon className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
        )}
      </span>
    </button>
  );
}
