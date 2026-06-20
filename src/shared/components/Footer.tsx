import { color } from "../utils/utils";
import packageJson from "../../../package.json";
import CurrentSettingsDisplay from "./CurrentSettingsDisplay";

interface FooterProps {
  className?: string;
}

export default function Footer({ className = "" }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const version = packageJson.version;

  return (
    <footer
      className={`w-full py-3 ${className}`}
      style={{
        backgroundColor: color.gradients.sidebar.bottom,
        zIndex: 100,
        position: "sticky",
        bottom: 0,
      }}
    >
      <div className="px-5 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Current Settings Display */}
          <CurrentSettingsDisplay />

          <div className="text-white text-xs">
            <p>
              &copy; {currentYear} @Sentra. All rights reserved. v{version}
            </p>
          </div>
          <div className="flex items-center gap-6 text-sm hidden">
            {/* <a
              href="#"
              className="text-white/70 hover:text-white transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="text-white/70 hover:text-white transition-colors"
            >
              Terms of Service
            </a>
            <a
              href="#"
              className="text-white/70 hover:text-white transition-colors"
            >
              Support
            </a> */}
          </div>
        </div>
      </div>
    </footer>
  );
}