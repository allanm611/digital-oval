import { ButtonHTMLAttributes, ReactNode } from "react";
import { color, tw, wizardActions } from "../../utils/utils";

export type WizardActionButtonVariant = "primary" | "outline";

interface WizardActionButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: WizardActionButtonVariant;
  /** Previous / Next: shared min-width so the pair stays aligned across wizard pages. */
  nav?: boolean;
  loading?: boolean;
  loadingLabel?: ReactNode;
  children: ReactNode;
}

/**
 * Toolbar action used by every multi-step wizard.
 *
 * Height is token-driven and identical for primary and outline (both use a 1px
 * border) so "Next Step" cannot outgrow Cancel / Previous / Save Draft.
 * `nav` locks Previous and Next to the same min-width on every page.
 */
export default function WizardActionButton({
  variant = "outline",
  nav = false,
  loading = false,
  loadingLabel,
  className = "",
  disabled,
  children,
  type = "button",
  style,
  ...props
}: WizardActionButtonProps) {
  const isPrimary = variant === "primary";
  const borderColor = isPrimary
    ? color.primary.action
    : "var(--c-bordered-button-color)";

  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${tw.wizardButton} ${nav ? tw.wizardNavButton : ""} ${
        isPrimary
          ? "focus:!border-[var(--c-primary-action)]"
          : "dark:text-white dark:border-white focus:!border-[var(--c-bordered-button-color)]"
      } ${className}`.trim()}
      style={{
        height: wizardActions.height,
        minWidth: nav ? wizardActions.navMinWidth : undefined,
        boxSizing: "border-box",
        background: isPrimary ? color.primary.action : "transparent",
        color: isPrimary ? "#ffffff" : "var(--c-bordered-button-color)",
        border: `${wizardActions.borderWidth} solid ${borderColor}`,
        ...style,
      }}
      {...props}
    >
      {loading ? (
        <>
          <span
            className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
          {loadingLabel ?? children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
