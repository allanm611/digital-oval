import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

export const darkTheme = EditorView.theme(
  {
    ".cm-editor": { backgroundColor: "#394247", color: "#d1d5db" },
    ".cm-gutters": { backgroundColor: "#394247", color: "#92a6b0", borderRight: "1px solid #4b5563" },
    ".cm-activeLineGutter": { backgroundColor: "#4b556333" },
    ".cm-cursor": { borderLeftColor: "#d1d5db" },
    ".cm-selectionBackground": { backgroundColor: "#4b5563" },
    "&.cm-focused .cm-selectionBackground": { backgroundColor: "#4b5563" },
    ".cm-matchingBracket": { backgroundColor: "#4b5563", outline: "1px solid #d1d5db" },
  },
  { dark: true }
);

export const darkSyntaxHighlight = syntaxHighlighting(
  HighlightStyle.define([
    { tag: t.keyword, color: "#60a0ff" },
    { tag: t.atom, color: "#ffa500" },
    { tag: t.number, color: "#ffa500" },
    { tag: t.string, color: "#7ec699" },
    { tag: t.comment, color: "#6b7280" },
    { tag: t.variableName, color: "#d1d5db" },
  ])
);
