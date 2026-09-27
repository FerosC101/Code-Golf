import { lazy, Suspense, useRef } from "react";
import type { EditorProps } from "@monaco-editor/react";

// Monaco is ~3MB; only the play and host screens pay for it.
const Monaco = lazy(async () => {
  await import("../lib/monaco");
  return import("@monaco-editor/react");
});

type Props = {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  className?: string;
  fontSize?: number;
  onSubmitShortcut?: () => void;
  onRunShortcut?: () => void;
};

export function CodeEditor({ value, onChange, readOnly, className = "", fontSize = 15, onSubmitShortcut, onRunShortcut }: Props) {
  // Monaco commands are bound once at mount; refs keep them pointing at fresh handlers.
  const submitRef = useRef(onSubmitShortcut);
  const runRef = useRef(onRunShortcut);
  submitRef.current = onSubmitShortcut;
  runRef.current = onRunShortcut;
  const options: EditorProps["options"] = {
    readOnly,
    domReadOnly: readOnly,
    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
    fontSize,
    fontLigatures: false, // ligatures would hide characters. every one counts.
    lineHeight: Math.round(fontSize * 1.6),
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    renderWhitespace: readOnly ? "none" : "all",
    renderLineHighlight: readOnly ? "none" : "line",
    wordWrap: "on",
    tabSize: 1,
    insertSpaces: true,
    detectIndentation: false,
    padding: { top: 14, bottom: 14 },
    lineNumbersMinChars: 3,
    glyphMargin: false,
    folding: false,
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
    quickSuggestions: false,
    suggestOnTriggerCharacters: false,
    parameterHints: { enabled: false },
    wordBasedSuggestions: "off",
    autoClosingBrackets: "never",
    autoClosingQuotes: "never",
    contextmenu: false,
    stickyScroll: { enabled: false },
    unicodeHighlight: { ambiguousCharacters: false },
  };

  return (
    <div className={`relative min-h-0 ${className}`}>
      <Suspense fallback={<EditorFallback />}>
        <Monaco
          height="100%"
          language="python"
          theme="codegolf"
          value={value}
          onChange={(v) => onChange?.(v ?? "")}
          options={options}
          loading={<EditorFallback />}
          onMount={(editor, monaco) => {
            editor.getModel()?.setEOL(monaco.editor.EndOfLineSequence.LF);
            editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter, () =>
              submitRef.current?.(),
            );
            editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => runRef.current?.());
          }}
        />
      </Suspense>
    </div>
  );
}

function EditorFallback() {
  return (
    <div className="flex h-full items-center justify-center font-mono text-xs text-fog">
      <span className="text-green">&gt;</span>&nbsp;loading editor<span className="animate-blink">_</span>
    </div>
  );
}
