import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import TextAlign from "@tiptap/extension-text-align";
import { Bold, CheckSquare, Heading2, Italic, List, ListOrdered, Redo2, Underline, Undo2 } from "lucide-react-native";
import { useEffect, useRef, type ReactNode } from "react";
import type { TipTapDocument } from "../../../packages/contracts/src/notes";

type Props = {
  initialContent: TipTapDocument;
  disabled?: boolean;
  onChange: (value: { content: TipTapDocument; plainTextPreview: string }) => void;
};

export function MobileRichNoteEditor({ initialContent, disabled, onChange }: Props) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Write a rich note..." }),
      TaskList,
      TaskItem.configure({ nested: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: initialContent,
    editable: !disabled,
    onUpdate: ({ editor: instance }) => onChangeRef.current({ content: instance.getJSON() as TipTapDocument, plainTextPreview: instance.getText() }),
  }, []);

  useEffect(() => { editor?.setEditable(!disabled); }, [disabled, editor]);

  if (!editor) return <div style={{ minHeight: 210, border: "1px solid #94a3b8", borderRadius: 7 }} />;
  const run = (command: () => void) => { if (!disabled) command(); };
  const toolbarButton = (label: string, icon: ReactNode, command: () => void, active = false) => <button
    type="button"
    aria-label={label}
    title={label}
    disabled={disabled}
    onClick={() => run(command)}
    style={{ ...styles.toolbarButton, ...(active ? styles.toolbarButtonActive : {}), ...(disabled ? styles.toolbarButtonDisabled : {}) }}
  >{icon}</button>;
  return <div style={styles.editorShell}>
    <div aria-label="Rich note formatting tools" style={styles.toolbar}>
      {toolbarButton("Heading", <Heading2 size={16} strokeWidth={2.2} />, () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive("heading", { level: 2 }))}
      <span style={styles.toolbarDivider} aria-hidden="true" />
      {toolbarButton("Bold", <Bold size={16} />, () => editor.chain().focus().toggleBold().run(), editor.isActive("bold"))}
      {toolbarButton("Italic", <Italic size={16} />, () => editor.chain().focus().toggleItalic().run(), editor.isActive("italic"))}
      {toolbarButton("Underline", <Underline size={16} />, () => editor.chain().focus().toggleUnderline().run(), editor.isActive("underline"))}
      <span style={styles.toolbarDivider} aria-hidden="true" />
      {toolbarButton("Bullet list", <List size={17} />, () => editor.chain().focus().toggleBulletList().run(), editor.isActive("bulletList"))}
      {toolbarButton("Numbered list", <ListOrdered size={17} />, () => editor.chain().focus().toggleOrderedList().run(), editor.isActive("orderedList"))}
      {toolbarButton("Checklist", <CheckSquare size={16} />, () => editor.chain().focus().toggleTaskList().run(), editor.isActive("taskList"))}
      <span style={styles.toolbarDivider} aria-hidden="true" />
      {toolbarButton("Align left", <span style={styles.textTool}>L</span>, () => editor.chain().focus().setTextAlign("left").run(), editor.isActive({ textAlign: "left" }))}
      {toolbarButton("Align center", <span style={styles.textTool}>C</span>, () => editor.chain().focus().setTextAlign("center").run(), editor.isActive({ textAlign: "center" }))}
      <span style={styles.toolbarSpacer} />
      {toolbarButton("Undo", <Undo2 size={16} />, () => editor.chain().focus().undo().run())}
      {toolbarButton("Redo", <Redo2 size={16} />, () => editor.chain().focus().redo().run())}
    </div>
    <EditorContent editor={editor} className="mobile-rich-editor__content" />
    <style>{editorStyles}</style>
  </div>;
}

const editorStyles = `
  .mobile-rich-editor__content .ProseMirror {
    min-height: 178px;
    padding: 14px 16px;
    color: #172033;
    font-family: inherit;
    font-size: 14px;
    line-height: 1.55;
    outline: none;
  }
  .mobile-rich-editor__content .ProseMirror:focus {
    box-shadow: inset 0 0 0 2px #2563eb;
  }
  .mobile-rich-editor__content .ProseMirror p.is-editor-empty:first-child::before {
    color: #94a3b8;
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
  }
  .mobile-rich-editor__content .ProseMirror h2 { color: #0f172a; font-size: 18px; line-height: 1.3; margin: 4px 0 10px; }
  .mobile-rich-editor__content .ProseMirror p { margin: 0 0 10px; }
  .mobile-rich-editor__content .ProseMirror ul,
  .mobile-rich-editor__content .ProseMirror ol { margin: 8px 0 12px; padding-left: 24px; }
  .mobile-rich-editor__content .ProseMirror a { color: #1d4ed8; text-decoration: underline; }
`;

const styles = {
  editorShell: { background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 10, boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)", overflow: "hidden" } as const,
  toolbar: { alignItems: "center", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", gap: 4, minHeight: 48, overflowX: "auto", padding: "6px 8px", whiteSpace: "nowrap" } as const,
  toolbarButton: { alignItems: "center", background: "transparent", border: "1px solid transparent", borderRadius: 7, color: "#475569", cursor: "pointer", display: "inline-flex", flex: "0 0 auto", height: 36, justifyContent: "center", minWidth: 36, padding: 0, transition: "background 120ms ease, border-color 120ms ease, color 120ms ease" } as const,
  toolbarButtonActive: { background: "#dbeafe", borderColor: "#93c5fd", color: "#1d4ed8" } as const,
  toolbarButtonDisabled: { cursor: "not-allowed", opacity: 0.45 } as const,
  toolbarDivider: { background: "#e2e8f0", flex: "0 0 auto", height: 22, margin: "0 3px", width: 1 } as const,
  toolbarSpacer: { flex: 1 } as const,
  textTool: { fontSize: 12, fontWeight: "800" } as const,
};
