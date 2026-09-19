import type { MouseEvent } from "react";
import { ExternalLink } from "lucide-react";
import { tw } from "../../../shared/utils/utils";

interface ProviderDocsLinkProps {
  name: string;
  href: string;
  className?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
}

export default function ProviderDocsLink({
  name,
  href,
  className = "",
  onClick,
}: ProviderDocsLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 text-sm font-semibold underline underline-offset-2 ${tw.link} hover:opacity-80 ${className}`}
    >
      Open {name} docs
      <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden />
    </a>
  );
}
