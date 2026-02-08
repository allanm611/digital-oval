import { Lock, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { color } from "../../../shared/utils/utils";

export default function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
    //   style={{ backgroundColor: color.surface.background }}
    >
      <div className="text-center">
        <Lock
          className="w-16 h-16 mx-auto mb-6"
          style={{ color: color.status.danger }}
        />
        <p
          className="text-sm font-medium mb-8"
          style={{ color: color.text.primary }}
        >
          You don't have the permissions to view this page
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:opacity-90"
          style={{ backgroundColor: color.primary.action }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
