import { tw } from "../../shared/utils/utils";

interface DocsFooterProps {
  version: string;
}

export default function DocsFooter({ version }: DocsFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`border-t border-gray-200 ${tw.primaryBackground} overflow-hidden`}>
      {/* Grid Pattern Background */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 0, 0, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      ></div>

      <div className="relative z-10 px-5 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs md:text-sm">
          <div className={tw.textMuted}>
            © {currentYear} Sentra CVM. All rights reserved.
          </div>
          <div className={tw.textMuted}>
            Version {version}
          </div>
        </div>
      </div>
    </footer>
  );
}
