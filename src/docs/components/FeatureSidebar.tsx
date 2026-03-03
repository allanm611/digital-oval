import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { tw } from "../../shared/utils/utils";

interface FeatureNavItem {
  title: string;
  path?: string;
  children?: FeatureNavItem[];
}

const featureNav: FeatureNavItem[] = [
  {
    title: "Campaign Management",
    children: [
      { title: "Campaigns", path: "features/campaigns" },
      { title: "Campaign Objectives", path: "features/campaign-objectives" },
    ],
  },
];

export default function FeatureSidebar() {
  const { "*": featurePath } = useParams();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (title: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const renderNavItems = (items: FeatureNavItem[]): JSX.Element[] => {
    return items.map((item, idx) => {
      const hasChildren = item.children && item.children.length > 0;
      const isExpanded = expandedSections[item.title];
      const isActive = featurePath?.startsWith(item.path || "");

      return (
        <div key={idx}>
          {item.path ? (
            <Link
              to={`/docs/${item.path}`}
              className={`block px-4 py-2.5 text-sm rounded transition-colors ${
                isActive
                  ? `font-semibold text-emerald-500 bg-emerald-500/10`
                  : `${tw.textSecondary} hover:text-emerald-500`
              }`}
            >
              {item.title}
            </Link>
          ) : (
            <button
              onClick={() => toggleSection(item.title)}
              className={`w-full px-4 py-2.5 text-sm flex items-center justify-between rounded transition-colors ${tw.textSecondary} hover:text-emerald-500 font-semibold`}
            >
              <span>{item.title}</span>
              {hasChildren && (
                <ChevronDown
                  size={16}
                  className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
                />
              )}
            </button>
          )}

          {hasChildren && isExpanded && item.children && (
            <div className="pl-4 mt-1 space-y-1">
              {renderNavItems(item.children)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto h-screen sticky top-16">
      <div className="pt-6 pb-8 px-4 space-y-1">
        <nav className="space-y-1">
          {renderNavItems(featureNav)}
        </nav>
      </div>
    </aside>
  );
}
