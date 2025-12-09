import { useState, useRef, useEffect } from "react";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import { color , tw} from "../../../shared/utils/utils";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Enter your message...",
  minHeight = "200px",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const execCommand = (
    command: string,
    value: string | undefined = undefined
  ) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateContent();
  };

  const updateContent = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    updateContent();
  };

  const toolbarButtons = [
    { icon: Bold, command: "bold", title: "Bold" },
    { icon: Italic, command: "italic", title: "Italic" },
    { icon: Underline, command: "underline", title: "Underline" },
    { type: "separator" },
    { icon: List, command: "insertUnorderedList", title: "Bullet List" },
    { icon: ListOrdered, command: "insertOrderedList", title: "Numbered List" },
    { type: "separator" },
    { icon: AlignLeft, command: "justifyLeft", title: "Align Left" },
    { icon: AlignCenter, command: "justifyCenter", title: "Align Center" },
    { icon: AlignRight, command: "justifyRight", title: "Align Right" },
  ];

  return (
    <div className={`border border-gray-300 ${tw.rounded} overflow-hidden`}>
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex items-center gap-1 flex-wrap">
        {toolbarButtons.map((button, index) => {
          if (button.type === "separator") {
            return <div key={index} className="w-px h-6 bg-gray-300 mx-1" />;
          }

          const Icon = button.icon!;
          return (
            <button
              key={index}
              type="button"
              onClick={() => execCommand(button.command!)}
              className="p-2 hover:bg-gray-200 rounded transition-colors"
              title={button.title}
              style={{
                color: "#6B7280",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${color.primary.accent}15`;
                e.currentTarget.style.color = color.primary.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#6B7280";
              }}
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}

        <div className="flex-1" />

        {/* Font Size Selector */}
        <HeadlessSelect
          value="3"
          onChange={(value) => execCommand("fontSize", value as string)}
          options={[
            { label: "Tiny", value: "1" },
            { label: "Small", value: "2" },
            { label: "Normal", value: "3" },
            { label: "Medium", value: "4" },
            { label: "Large", value: "5" },
            { label: "Huge", value: "6" },
          ]}
          placeholder="Font Size"
          className="w-auto min-w-[100px]"
        />
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="p-4 outline-none"
        style={{
          minHeight,
          maxHeight: "400px",
          overflowY: "auto",
          boxShadow: isFocused ? `0 0 0 2px ${color.primary.accent}40` : "none",
        }}
        data-placeholder={placeholder}
      />

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          pointer-events: none;
        }
        
        [contenteditable] .variable-tag {
          user-select: none;
          cursor: default;
        }
        
        [contenteditable] ul,
        [contenteditable] ol {
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        
        [contenteditable] p {
          margin: 0.5rem 0;
        }
      `}</style>
    </div>
  );
}
