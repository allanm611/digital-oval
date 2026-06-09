import { useState, useRef } from "react";
import { ChevronDown, Type, Sparkles, AlignLeft } from "lucide-react";
import { tw, color } from "../../../shared/utils/utils";
import { CommunicationChannel } from "../types/communication";
import RichTextEditor from "./RichTextEditor";
import Input from "../../../shared/components/ui/Input";
import Textarea from "../../../shared/components/ui/Textarea";
import { validateInsertPosition, validateMessageSyntax } from "../../../shared/utils/variableInsertion";

interface MessageEditorProps {
  title: string;
  body: string;
  channel: CommunicationChannel;
  availableVariables: string[];
  onTitleChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  isRichText?: boolean;
  onToggleRichText?: () => void;
}

export default function MessageEditor({
  title,
  body,
  channel,
  availableVariables,
  onTitleChange,
  onBodyChange,
  isRichText = false,
  onToggleRichText,
}: MessageEditorProps) {
  const [showVariables, setShowVariables] = useState(false);
  const [activeField, setActiveField] = useState<"title" | "body">("body");
  const [cursorPosition, setCursorPosition] = useState<number>(0);
  const [variableError, setVariableError] = useState<string>("");
  const titleInputRef = useRef<HTMLInputElement>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);

  const insertVariable = (variable: string) => {
    const formattedVariable = `{{${variable}}}`;

    // Get actual cursor position from DOM element
    let actualCursorPosition = cursorPosition;
    if (activeField === "title" && titleInputRef.current) {
      actualCursorPosition = titleInputRef.current.selectionStart || 0;
    } else if (activeField === "body" && bodyTextareaRef.current) {
      actualCursorPosition = bodyTextareaRef.current.selectionStart || 0;
    }

    const currentText = activeField === "title" ? title : body;

    // Validate cursor position
    const positionError = validateInsertPosition(currentText, actualCursorPosition);
    if (positionError) {
      setVariableError(positionError);
      return;
    }

    setVariableError(""); // Clear any previous errors

    if (activeField === "title") {
      // Insert at cursor position in title
      const newTitle =
        title.slice(0, actualCursorPosition) +
        formattedVariable +
        title.slice(actualCursorPosition);
      onTitleChange(newTitle);
    } else {
      // Insert at cursor position in body or at the end
      if (isRichText) {
        // For rich text, append at the end with a space
        onBodyChange(body + " " + formattedVariable + " ");
      } else {
        const newBody =
          body.slice(0, actualCursorPosition) +
          formattedVariable +
          body.slice(actualCursorPosition);
        onBodyChange(newBody);
      }
    }
    setShowVariables(false);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCursorPosition(e.target.selectionStart || 0);
    onTitleChange(e.target.value);
    // Validate title syntax
    const error = validateMessageSyntax(e.target.value);
    if (error) setVariableError(error);
  };

  const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCursorPosition(e.target.selectionStart || 0);
    onBodyChange(e.target.value);
    // Validate body syntax
    const error = validateMessageSyntax(e.target.value);
    if (error) setVariableError(error);
    else setVariableError("");
  };

  const hasTitle = channel === "EMAIL";

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <label className={tw.label}>Message Content</label>
        <div className="flex items-center flex-wrap gap-2">
          {/* Rich Text Toggle */}
          {channel === "EMAIL" && onToggleRichText && (
            <button
              type="button"
              onClick={onToggleRichText}
              className={`flex items-center space-x-2 px-3 py-1.5 text-sm ${tw.rounded} border transition-colors whitespace-nowrap`}
              style={{
                backgroundColor: isRichText
                  ? `${color.primary.accent}15`
                  : "white",
                borderColor: isRichText ? color.primary.accent : "#D1D5DB",
                color: isRichText ? color.primary.accent : "#6B7280",
              }}
            >
              {isRichText ? (
                <Sparkles className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlignLeft className="w-4 h-4 flex-shrink-0" />
              )}
              <span className="hidden sm:inline">
                {isRichText ? "Rich Text" : "Plain Text"}
              </span>
              <span className="sm:hidden">{isRichText ? "Rich" : "Plain"}</span>
            </button>
          )}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowVariables(!showVariables)}
              className={`flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 ${tw.rounded} hover:bg-gray-50 transition-colors whitespace-nowrap`}
            >
              <Type className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Insert Variable</span>
              <span className="sm:hidden">Variables</span>
              <ChevronDown className="w-4 h-4 flex-shrink-0" />
            </button>
            {showVariables && (
              <div className={`absolute right-0 sm:right-0 left-0 sm:left-auto top-full mt-2 w-full sm:w-56 bg-white border border-gray-200 ${tw.rounded} shadow-lg z-10 overflow-hidden`}>
                <div className="p-2 bg-gray-50 border-b border-gray-200">
                  <p className="text-xs font-medium text-gray-600 uppercase">
                    Available Variables
                  </p>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {availableVariables.map((variable) => (
                    <button
                      key={variable}
                      type="button"
                      onClick={() => insertVariable(variable)}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 transition-colors hover-variable-btn"
                      style={
                        {
                          "--hover-bg": `${color.primary.accent}15`,
                          "--hover-color": color.primary.accent,
                        } as React.CSSProperties & {
                          "--hover-bg"?: string;
                          "--hover-color"?: string;
                        }
                      }
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = `${color.primary.accent}15`;
                        e.currentTarget.style.color = color.primary.accent;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "#374151";
                      }}
                    >
                      <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                        {`{{${variable}}}`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {hasTitle && (
        <Input
          ref={titleInputRef}
          label="Subject Line"
          value={title}
          onChange={(value) => {
            onTitleChange(value);
            // Also validate on change
            const error = validateMessageSyntax(value);
            if (error) setVariableError(error);
          }}
          onClick={(e) => {
            setActiveField("title");
            setCursorPosition(e.currentTarget.selectionStart || 0);
          }}
          onKeyUp={(e) =>
            setCursorPosition(e.currentTarget.selectionStart || 0)
          }
          onFocus={(e) => {
            setActiveField("title");
            setCursorPosition(e.currentTarget.selectionStart || 0);
          }}
          onBlur={() => {}}
         
        />
      )}

      <div>
        {variableError && (
          <div className="mb-3 text-sm text-red-700">
            {variableError}
          </div>
        )}
        {isRichText ? (
          <div
            onClick={() => setActiveField("body")}
            onFocus={() => setActiveField("body")}
          >
            <RichTextEditor
              value={body}
              onChange={onBodyChange}
              placeholder="Create your beautiful message with rich formatting..."
              minHeight="250px"
            />
          </div>
        ) : (
          <>
            <Textarea
              ref={bodyTextareaRef}
              label="Message Body"
              value={body}
              onChange={(value) => {
                onBodyChange(value);
                handleBodyChange({ target: { value, selectionStart: 0 } } as any);
              }}
              onClick={(e) => {
                setActiveField("body");
                setCursorPosition(e.currentTarget.selectionStart || 0);
              }}
              onKeyUp={(e) =>
                setCursorPosition(e.currentTarget.selectionStart || 0)
              }
              onFocus={(e) => {
                setActiveField("body");
                setCursorPosition(e.currentTarget.selectionStart || 0);
              }}
              onBlur={() => {}}
              rows={8}
              className="font-mono"
            />
            <p className="mt-2 text-xs text-gray-500">
              {`Character count: ${body.length} | `}
              Variables will be replaced with actual data when sent
            </p>
          </>
        )}
      </div>
    </div>
  );
}
