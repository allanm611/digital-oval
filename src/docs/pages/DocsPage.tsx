import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  ChevronLeft,
  ChevronDown,
  AlertCircle,
  LogIn,
  LayoutDashboard,
  Megaphone,
  MessageCircle,
  Users,
  Settings,
  Layers,
  Gift,
  List,
  BarChart3,
  TrendingUp,
  Zap,
  Server,
  Lock,
  ShoppingCart,
  Database,
  Mail,
  Box,
  UserCheck,
  UserRound,
} from "lucide-react";
import { color, tw } from "../../shared/utils/utils";
import LoadingSpinner from "../../shared/components/ui/LoadingSpinner";
import DocsHeader from "../components/DocsHeader";
import DocsHero from "../components/DocsHero";
import DocsFooter from "../components/DocsFooter";
import { docsNav } from "../config/docsNav";

interface DocContent {
  title: string;
  content: string;
  path: string;
}

// Icon mapping for feature categories
const iconMap: Record<string, React.ReactNode> = {
  "Campaign Management": <TrendingUp size={24} />,
  "Offer Management": <Gift size={24} />,
  "Product Management": <Box size={24} />,
  "Segment Management": <Users size={24} />,
  "Customer 360 Profile": <UserRound size={24} />,
  "User Management": <UserCheck size={24} />,
  Communications: <Mail size={24} />,
  "Reports & Analytics": <BarChart3 size={24} />,
  "System & Configuration": <Settings size={24} />,
};

export default function DocsPage() {
  const { "*": docPath } = useParams();
  const [docContent, setDocContent] = useState<DocContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState("1.2.1");

  // Load version from package.json
  useEffect(() => {
    const loadVersion = async () => {
      try {
        const response = await fetch("/package.json");
        const pkg = await response.json();
        setVersion(pkg.version);
      } catch {
        setVersion("1.2.2");
      }
    };
    loadVersion();
  }, []);

  useEffect(() => {
    const loadDoc = async () => {
      // If no path, show homepage
      if (!docPath) {
        setLoading(false);
        setDocContent(null);
        setError(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Determine file path
        let path = docPath;

        // If path ends with a folder (no .md extension), append /README
        if (path && !path.endsWith(".md") && path !== "README") {
          path = `${path}/README`;
        }

        // Load markdown file dynamically from content folder
        const modulePath = `../content/${path}.md`;
        const module = await import(/* @vite-ignore */ modulePath);
        const content = module.default;
        const title = path.split("/").pop() || "Documentation";

        setDocContent({
          title,
          content,
          path,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load document");
        setDocContent(null);
      } finally {
        setLoading(false);
      }
    };

    loadDoc();
  }, [docPath]);

  const isHomepage = !docPath;

  return (
    <div className={`w-full flex flex-col min-h-screen`}>
      <DocsHeader />

      <main
        className={`flex-1 flex flex-col`}
      >
          {isHomepage ? (
            // Homepage View
            <>
              <DocsHero />
              <div id="features" className={`flex-1 px-5 lg:px-8 py-20 ${tw.primaryBackground}`}>
                <div className="max-w-7xl mx-auto">
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {docsNav.map((section, idx) => (
                      <div key={idx}>
                        <Link
                          to={section.path ? `/docs/${section.path}` : "#"}
                          className="flex items-start gap-3 mb-2 p-3 rounded group inline-flex cursor-pointer relative"
                        >
                          <div className="text-emerald-600 flex-shrink-0 group-hover:scale-110 transition-transform duration-200 pointer-events-none">
                            {iconMap[section.title] || <Layers size={24} />}
                          </div>
                          <div className="pointer-events-none">
                            <h3 className={`text-xl font-bold ${tw.textPrimary} group-hover:text-emerald-600 transition-colors duration-200 relative`}>
                              {section.title}
                              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-600 transition-all duration-200 group-hover:w-full"></span>
                            </h3>
                          </div>
                        </Link>

                        {section.children && (
                          <ul className="space-y-3 pl-9">
                            {section.children.map((item, itemIdx) => (
                              <li key={itemIdx}>
                                {item.path ? (
                                  <Link
                                    to={`/docs/${item.path}`}
                                    className={`text-sm font-medium text-gray-700 hover:text-emerald-600 cursor-pointer transition-colors duration-200 relative inline-block group`}
                                  >
                                    {item.title}
                                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-600 transition-all duration-200 group-hover:w-full"></span>
                                  </Link>
                                ) : (
                                  <span className={`text-sm font-medium text-gray-500`}>
                                    {item.title}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Document View
            <div className={`flex-1 px-5 lg:px-8 py-6 ${tw.primaryBackground} pb-24`}>
              <div className="max-w-3xl">
                {loading && (
                  <div className="flex items-center justify-center py-16">
                    <LoadingSpinner />
                  </div>
                )}

                {error && (
                  <div
                    className={`bg-[${color.status.danger}]/10 border border-[${color.status.danger}] rounded-md p-6 mb-6`}
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle
                        size={20}
                        className={`text-[${color.status.danger}] flex-shrink-0 mt-0.5`}
                      />
                      <div>
                        <h2
                          className={`font-semibold text-[${color.status.danger}] mb-1`}
                        >
                          Document Not Found
                        </h2>
                        <p className={`text-sm text-[${color.status.danger}] mb-4`}>
                          {error}
                        </p>
                        <a
                          href="/docs"
                          className={`inline-flex items-center gap-2 ${tw.link} hover:opacity-70 transition-opacity text-sm font-medium`}
                        >
                          <ChevronLeft size={16} />
                          Back to Documentation
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {docContent && !loading && (
                  <div>
                    <article className="prose prose-sm max-w-none">
                      <ReactMarkdown
                        components={{
                          h1: (props) => (
                            <h1
                              className={`text-3xl font-bold mb-6 ${tw.textPrimary}`}
                              {...props}
                            />
                          ),
                          h2: (props) => (
                            <h2
                              className={`text-2xl font-semibold mt-8 mb-4 ${tw.textPrimary}`}
                              {...props}
                            />
                          ),
                          h3: (props) => (
                            <h3
                              className={`text-xl font-semibold mt-6 mb-3 ${tw.textSecondary}`}
                              {...props}
                            />
                          ),
                          p: (props) => (
                            <p
                              className={`mb-4 ${tw.textSecondary} leading-7`}
                              {...props}
                            />
                          ),
                          ul: (props) => (
                            <ul
                              className="list-disc list-inside mb-4 space-y-2"
                              {...props}
                            />
                          ),
                          ol: (props) => (
                            <ol
                              className="list-decimal list-inside mb-4 space-y-2"
                              {...props}
                            />
                          ),
                          li: (props) => <li className={`${tw.textSecondary}`} {...props} />,
                          code: (props: {
                            inline?: boolean;
                            children?: React.ReactNode;
                          }) => {
                            const { inline, ...restProps } = props;
                            return inline ? (
                              <code
                                className={`bg-[${color.surface.tableHeader}] text-[${color.primary.action}] px-2 py-1 rounded text-sm font-mono`}
                                {...restProps}
                              />
                            ) : (
                              <code
                                className={`block bg-[${color.surface.tableHeader}] text-[${color.text.primary}] p-4 rounded-md overflow-x-auto font-mono text-sm mb-4`}
                                {...restProps}
                              />
                            );
                          },
                          a: (props) => (
                            <a
                              className={`text-black underline hover:text-black hover:border-b-2 hover:border-emerald-600 transition-all`}
                              {...props}
                            />
                          ),
                          img: (props) => (
                            <img
                              className="max-w-full h-auto rounded-md my-6 border border-gray-200"
                              {...props}
                            />
                          ),
                          blockquote: (props) => (
                            <blockquote
                              className={`border-l-4 border-[${color.primary.accent}] pl-4 my-4 ${tw.textSecondary} italic`}
                              {...props}
                            />
                          ),
                          table: (props) => (
                            <div className="overflow-x-auto my-4 rounded-md border border-gray-200">
                              <table className="w-full" {...props} />
                            </div>
                          ),
                          th: (props) => (
                            <th
                              className={`bg-[${color.surface.tableHeader}] ${tw.textPrimary} px-4 py-2 text-left font-semibold border-b border-gray-200`}
                              {...props}
                            />
                          ),
                          td: (props) => (
                            <td
                              className={`${tw.textSecondary} px-4 py-2 border-b border-gray-200`}
                              {...props}
                            />
                          ),
                        }}
                      >
                        {docContent.content}
                      </ReactMarkdown>
                    </article>
                  </div>
                )}
              </div>
            </div>
          )}

        <DocsFooter version={version} />
      </main>
    </div>
  );
}
