import React from "react";
import { LucideIcon } from "lucide-react";
import { colors as color } from "../../utils/tokens";

import { tw } from "../../../shared/utils/utils";
interface FormSectionProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}

export default function FormSection({
  title,
  description,
  icon: Icon,
  children,
  className = "",
}: FormSectionProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-start space-x-4">
        {Icon && (
          <div className="flex-shrink-0">
            <div
              className={`flex items-center justify-center w-10 h-10 ${tw.rounded}`}
              style={{ backgroundColor: color.primary.action }}
            >
              <Icon className="w-5 h-5 text-white" />
            </div>
          </div>
        )}
        <div className="flex-1">
          <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-1`}>
            {title}
          </h3>
          {description && (
            <p className={`text-sm ${tw.textSecondary}`}>{description}</p>
          )}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
