import { color } from "../utils/utils";

interface FooterProps {
  className?: string;
}

export default function Footer({ className = "" }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={`w-full py-6 ${className}`}
      style={{
        backgroundColor: color.gradients.sidebar.bottom,
      }}
    >
      <div className="px-5 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-white text-sm">
            <p>&copy; {currentYear} Effortel. All rights reserved.</p>
          </div>
          <div className="flex items-center gap-6 text-sm">
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
