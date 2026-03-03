import { useAuth } from "../../contexts/AuthContext";
import { Link } from "react-router-dom";
import { Search, LogOut } from "lucide-react";
import { tw, color } from "../../shared/utils/utils";

export default function DocsHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 h-16">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-8 h-full flex items-center justify-between flex-nowrap gap-2">

        {/* Left: Sentra Text (Fixed Width Area) */}
        <div className="flex-1 flex justify-start min-w-[100px] md:min-w-[140px]">
          <Link to="/docs" className="flex items-center h-16">
            <h1 className="text-lg md:text-xl font-bold text-black">
              Sentra
            </h1>
          </Link>
        </div>

        {/* Center: Search (Flexible Center) */}
        <div className="flex-[2] flex justify-center max-w-xl">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search..."
              className={`w-full pl-3 pr-8 py-2 rounded-lg border ${tw.borderDefault} text-sm focus:outline-none focus:ring-2 focus:ring-[${color.primary.accent}]/20`}
            />
            <Search size={16} className={`absolute right-2.5 top-2.5 ${tw.textMuted}`} />
          </div>
        </div>

        {/* Right: Auth (Icon-only on mobile to save space) */}
        <div className="flex-1 flex justify-end items-center gap-1 sm:gap-3 min-w-fit">
          {user ? (
            <>
              <span className={`text-sm hidden lg:block ${tw.textSecondary}`}>
                {user.first_name || user.email}
              </span>
              <button
                onClick={() => logout()}
                className={`p-2 rounded-lg ${tw.textPrimary} hover:bg-gray-100`}
              >
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-1">
              <Link
                to="/login"
                className={`px-2 py-2 text-xs sm:text-sm font-medium ${tw.textPrimary} whitespace-nowrap`}
              >
                Login
              </Link>
              <Link
                to="/request-account"
                className={`px-3 py-2 text-xs sm:text-sm font-semibold bg-[${color.primary.accent}] text-white rounded-lg hover:opacity-90 whitespace-nowrap`}
              >
                {/* Text changes based on screen size so it never pushes the search bar out */}
                <span className="hidden xs:inline">Sign Up</span>
                <span className="xs:hidden">Join</span>
              </Link>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
