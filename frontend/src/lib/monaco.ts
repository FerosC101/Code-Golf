// Bundle Monaco locally instead of pulling it from a CDN at game time.
import * as monaco from "monaco-editor";
import EditorWorker from "monaco-editor/editor/editor.worker?worker";
import { loader } from "@monaco-editor/react";

self.MonacoEnvironment = { getWorker: () => new EditorWorker() };

monaco.editor.defineTheme("codegolf", {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "comment", foreground: "5f7580", fontStyle: "italic" },
    { token: "keyword", foreground: "5cff72" },
    { token: "string", foreground: "f2d38a" },
    { token: "number", foreground: "ffc24b" },
    { token: "identifier", foreground: "f2ebdd" },
    { token: "delimiter", foreground: "8b9ca4" },
    { token: "type", foreground: "7fd0ff" },
  ],
  colors: {
    "editor.background": "#081416",
    "editor.foreground": "#f2ebdd",
    "editor.lineHighlightBackground": "#0e2022",
    "editor.lineHighlightBorder": "#00000000",
    "editorLineNumber.foreground": "#34464e",
    "editorLineNumber.activeForeground": "#5cff72",
    "editorCursor.foreground": "#5cff72",
    "editor.selectionBackground": "#1d5a3a",
    "editor.inactiveSelectionBackground": "#153a2a",
    "editorWhitespace.foreground": "#2a3d44",
    "editorIndentGuide.background1": "#152428",
    "editorBracketMatch.border": "#5cff72",
    "editorBracketMatch.background": "#063d2c",
    "scrollbarSlider.background": "#26343b80",
    "editorWidget.background": "#0b181b",
    "editorWidget.border": "#26343b",
  },
});

loader.config({ monaco });
export { monaco };
