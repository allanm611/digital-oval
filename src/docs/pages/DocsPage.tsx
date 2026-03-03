import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { ChevronLeft, AlertCircle } from "lucide-react";
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
        setVersion(pkg.version || "1.2.1");
      } catch {
        setVersion("1.2.1");
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

        const filePath = `/docs/${path}.md`;

        const response = await fetch(filePath);
        if (!response.ok) {
          throw new Error(`Document not found: ${path}`);
        }

        const content = await response.text();
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
              <div className={`flex-1 px-5 lg:px-8 py-16 ${tw.primaryBackground}`}>
                <div className="max-w-7xl mx-auto">
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
                    {docsNav.map((section, idx) => (
                      <div key={idx}>
                        <h3 className={`text-lg font-bold ${tw.textPrimary} mb-6 flex items-center gap-2`}>
                          {section.title}
                        </h3>
                        {section.children && (
                          <ul className="space-y-3">
                            {section.children.map((item, itemIdx) => (
                              <li key={itemIdx}>
                                {item.path ? (
                                  <Link
                                    to={`/docs/${item.path}`}
                                    className={`text-sm text-black border-b-2 border-transparent hover:text-black hover:border-emerald-600 pb-1 transition-colors duration-200 block`}
                                  >
                                    {item.title}
                                  </Link>
                                ) : (
                                  <span className={`text-sm ${tw.textSecondary}`}>
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
