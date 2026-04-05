import { useNavigate } from "react-router-dom";
import { button, color, tw } from "../utils/utils";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center"
      style={{ color: color.text.primary }}
    >
      <h1
        className="text-7xl font-bold mb-2"
        style={{ color: color.primary.accent }}
      >
        404
      </h1>
      <h2 className={`text-2xl font-semibold mb-3 ${tw.textPrimary}`}>
        Page Not Found
      </h2>
      <p className={`text-base mb-8 max-w-md ${tw.textSecondary}`}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => navigate(-1)}
          className="font-medium cursor-pointer hover:opacity-80 transition-opacity"
          style={{
            background: button.bordered.background,
            color: button.bordered.color,
            border: button.bordered.border,
            padding: `${button.bordered.paddingY} ${button.bordered.paddingX}`,
            borderRadius: button.bordered.borderRadius,
            fontSize: button.bordered.fontSize,
          }}
        >
          Go Back
        </button>
        <button
          onClick={() => navigate("/dashboard")}
          className="font-medium cursor-pointer hover:opacity-90 transition-opacity"
          style={{
            background: button.action.background,
            color: button.action.color,
            border: button.action.border,
            padding: `${button.action.paddingY} ${button.action.paddingX}`,
            borderRadius: button.action.borderRadius,
            fontSize: button.action.fontSize,
          }}
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
