"use client";

import { defaultKeymap, indentWithTab } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { Compartment, EditorState, type Extension } from "@codemirror/state";
import type { HocuspocusProvider } from "@hocuspocus/provider";
import {
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from "@codemirror/view";
import { tags } from "@lezer/highlight";
import { useEffect, useRef } from "react";
import { yCollab, yUndoManagerKeymap } from "y-codemirror.next";
import * as Y from "yjs";

/** Языки, для которых редактор умеет подключать синтаксический анализ и подсветку. */
export type EditorLanguage = "javascript" | "python";

/**
 * Пропсы низкоуровневой обёртки над CodeMirror.
 */
export interface CodeMirrorEditorProps {
  /** Совместный текст Yjs, являющийся источником документа CodeMirror. */
  sharedText: Y.Text;

  /** Данные присутствия для удалённых курсоров и выделений. */
  awareness: NonNullable<HocuspocusProvider["awareness"]>;

  /** Язык подсветки и синтаксического анализа. */
  language: EditorLanguage;
}

const editorTheme = EditorView.theme({
  "&": {
    height: "100%",
    backgroundColor: "transparent",
  },
  ".cm-scroller": {
    overflow: "auto",
    fontFamily: "inherit",
  },
  ".cm-content": { padding: "1rem 0" },
  ".cm-gutters": { backgroundColor: "transparent", borderRight: "1px solid hsl(var(--border))" },
});

// Цвета задаются отдельно от темы интерфейса, чтобы подсветка оставалась заметной
// и в светлом, и в тёмном режиме приложения.
const codeHighlightStyle = HighlightStyle.define([
  { tag: [tags.keyword, tags.modifier], color: "hsl(var(--primary))" },
  { tag: [tags.string, tags.special(tags.string)], color: "#22c55e" },
  { tag: [tags.number, tags.bool, tags.null], color: "#f59e0b" },
  {
    tag: [tags.comment, tags.lineComment, tags.blockComment],
    color: "hsl(var(--muted-foreground))",
  },
  {
    tag: [tags.function(tags.variableName), tags.definition(tags.function(tags.variableName))],
    color: "#60a5fa",
  },
  { tag: [tags.typeName, tags.className], color: "#f472b6" },
  { tag: [tags.operator, tags.punctuation], color: "hsl(var(--foreground))" },
]);

/**
 * Возвращает расширение CodeMirror для выбранного языка.
 * @param {EditorLanguage} language - Выбранный язык редактора.
 * @returns {Extension} Расширение синтаксиса и подсветки.
 */
function getLanguageExtension(language: EditorLanguage): Extension {
  return language === "python" ? python() : javascript({ typescript: true });
}

/**
 * Создаёт CodeMirror, связывает его с Y.Text и освобождает ресурсы при размонтировании.
 * @param {CodeMirrorEditorProps} props - Совместный текст, данные присутствия и язык.
 * @returns {import("react").ReactNode} DOM-контейнер редактора.
 */
export function CodeMirrorEditor(props: CodeMirrorEditorProps) {
  const { sharedText, awareness, language } = props;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const languageCompartmentRef = useRef(new Compartment());

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const undoManager = new Y.UndoManager(sharedText);
    const view = new EditorView({
      parent: containerRef.current,
      state: EditorState.create({
        doc: sharedText.toString(),
        extensions: [
          lineNumbers(),
          highlightActiveLine(),
          highlightActiveLineGutter(),
          keymap.of([indentWithTab, ...defaultKeymap, ...yUndoManagerKeymap]),
          languageCompartmentRef.current.of(getLanguageExtension(language)),
          syntaxHighlighting(codeHighlightStyle),
          editorTheme,
          yCollab(sharedText, awareness, { undoManager }),
        ],
      }),
    });

    editorViewRef.current = view;

    return () => {
      editorViewRef.current = null;
      view.destroy();
      undoManager.destroy();
    };
  }, []);

  useEffect(() => {
    const view = editorViewRef.current;
    if (!view) {
      return;
    }

    const languageEffect = languageCompartmentRef.current.reconfigure(
      getLanguageExtension(language),
    );
    view.dispatch({ effects: languageEffect });
  }, [language]);

  return <div ref={containerRef} className="h-full min-h-0 overflow-hidden" />;
}
