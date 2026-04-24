"use client";

import { useCallback, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, List, ListOrdered, Redo2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { plainTextToTiptapHtml } from "@/lib/plain-to-tiptap-html";
import { sanitizeContractText } from "@/lib/contract-text-sanitize";
import { tiptapJsonToContractPlain, type TiptapJsonDoc } from "@/lib/tiptap-contract-plain";
import { cn } from "@/lib/utils";

const trimPlainToMax = (s: string, max: number): string => {
  if (s.length <= max) {
    return s;
  }
  return s.slice(0, max);
};

export type ContractRichTextFieldProps = {
  name: string;
  id: string;
  remountKey: string | number;
  defaultValue: string;
  maxLength: number;
  placeholder: string;
  className?: string;
  minHeightClass?: string;
  requiredField?: boolean;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  onPlainLengthChange: (length: number) => void;
};

export const ContractRichTextField = ({
  name,
  id,
  remountKey,
  defaultValue,
  maxLength,
  placeholder,
  className,
  minHeightClass = "min-h-[120px]",
  requiredField = false,
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
  onPlainLengthChange,
}: ContractRichTextFieldProps) => {
  const hiddenRef = useRef<HTMLTextAreaElement | null>(null);
  const skippingRef = useRef(false);
  /** El padre suele pasar `(n) => setFieldLen("x")(n)` nuevo en cada render: ref evita ciclos con useCallback/useEffect. */
  const onLengthRef = useRef(onPlainLengthChange);
  onLengthRef.current = onPlainLengthChange;

  const syncPlainToForm = useCallback(
    (raw: string) => {
      const t = trimPlainToMax(raw.replace(/\r\n/g, "\n"), maxLength);
      const el = hiddenRef.current;
      if (el) {
        el.value = t;
        el.dispatchEvent(new Event("input", { bubbles: true }));
      }
      onLengthRef.current(t.length);
    },
    [maxLength],
  );

  const initialHtml = plainTextToTiptapHtml(defaultValue);

  const editor = useEditor(
    {
      immediatelyRender: false,
      shouldRerenderOnTransaction: true,
      extensions: [
        StarterKit.configure({
          heading: false,
          blockquote: false,
          code: false,
          codeBlock: false,
          horizontalRule: false,
        }),
        Placeholder.configure({
          placeholder,
          showOnlyWhenEditable: true,
        }),
      ],
      content: initialHtml,
      editorProps: {
        attributes: {
          id,
          "aria-label": "Editor de texto con formato",
          "aria-describedby": [describedBy, `${id}-rt-help`].filter(Boolean).join(" "),
          "aria-invalid": invalid ? "true" : "false",
          "aria-multiline": "true",
          class: cn("focus:outline-none w-full text-sm text-foreground px-3 py-2", minHeightClass, "prose-contract-editor"),
        },
        handleKeyDown: (_v, e) => {
          if (e.key === "Enter" && (e as KeyboardEvent & { isComposing?: boolean }).isComposing) {
            return true;
          }
          return false;
        },
      },
      onUpdate: ({ editor: ed }) => {
        if (skippingRef.current) {
          return;
        }
        const plain = tiptapJsonToContractPlain(ed.getJSON() as TiptapJsonDoc);
        if (plain.length > maxLength) {
          const cut = trimPlainToMax(plain, maxLength);
          skippingRef.current = true;
          ed.commands.setContent(plainTextToTiptapHtml(cut), { emitUpdate: false });
          skippingRef.current = false;
          syncPlainToForm(cut);
          return;
        }
        syncPlainToForm(plain);
      },
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- el contenido inicial se fija con remountKey
    [remountKey],
  );

  useEffect(() => {
    if (!editor) {
      return;
    }
    syncPlainToForm(tiptapJsonToContractPlain(editor.getJSON() as TiptapJsonDoc));
  }, [editor, syncPlainToForm]);

  const handlePasteClean = useCallback(() => {
    if (!editor) {
      return;
    }
    void (async () => {
      const clip = await navigator.clipboard.readText();
      const t = trimPlainToMax(sanitizeContractText(clip), maxLength);
      editor.commands.setContent(plainTextToTiptapHtml(t), { emitUpdate: false });
      syncPlainToForm(tiptapJsonToContractPlain(editor.getJSON() as TiptapJsonDoc));
    })();
  }, [editor, maxLength, syncPlainToForm]);

  if (!editor) {
    return (
      <div className={cn("flex flex-col gap-1.5", className)} id={id} aria-live="polite" aria-busy="true">
        <div
          className={cn("rounded-lg border border-input bg-muted/40 px-3 py-2 text-sm text-muted-foreground")}
        >
          Cargando editor…
        </div>
        <label htmlFor={`${id}-plain`} className="sr-only">
          Texto {name} (cargando)
        </label>
        <textarea
          ref={hiddenRef}
          className="sr-only"
          name={name}
          id={`${id}-plain`}
          defaultValue={defaultValue}
          required={requiredField}
          maxLength={maxLength}
          rows={1}
          tabIndex={-1}
        />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <p className="sr-only" id={`${id}-rt-help`}>
        Negrita, listas con viñeta o numeradas. En el contrato y el PDF se guarda como texto con guiones y números (1. 2. …),
        legible y compatible con la impresión.
      </p>
      <div className="flex flex-wrap items-center gap-1.5" role="toolbar" aria-label="Formato del texto">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "bg-muted" : ""}
          aria-pressed={editor.isActive("bold")}
          title="Negrita"
        >
          <Bold />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "bg-muted" : ""}
          aria-pressed={editor.isActive("italic")}
          title="Cursiva"
        >
          <Italic />
        </Button>
        <div className="h-4 w-px self-center bg-border" aria-hidden="true" />
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive("bulletList") ? "bg-muted" : ""}
          aria-pressed={editor.isActive("bulletList")}
          title="Lista con viñetas"
        >
          <List />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive("orderedList") ? "bg-muted" : ""}
          aria-pressed={editor.isActive("orderedList")}
          title="Lista numerada"
        >
          <ListOrdered />
        </Button>
        <div className="h-4 w-px self-center bg-border" aria-hidden="true" />
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => editor.chain().focus().undo().run()}
          title="Deshacer"
        >
          <Undo2 />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => editor.chain().focus().redo().run()}
          title="Rehacer"
        >
          <Redo2 />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handlePasteClean}
          className="ml-1 h-7 text-xs"
          title="Pegar y limpiar (Word/Excel)"
        >
          Pegar y limpiar
        </Button>
      </div>
      <div
        className={cn(
          "w-full min-h-0 overflow-y-auto overflow-x-visible pl-0.5 pr-1.5 pt-0.5 pb-1.5 rounded-lg border border-input bg-background shadow-sm transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/30",
        )}
        data-testid="contract-rtf-shell"
      >
        <EditorContent editor={editor} className="contract-rtf-content max-w-none" />
      </div>
      <label htmlFor={`${id}-plain`} className="sr-only">
        Texto asociado al campo {name} (sincronizado)
      </label>
      <textarea
        ref={hiddenRef}
        className="sr-only"
        name={name}
        id={`${id}-plain`}
        defaultValue={defaultValue}
        required={requiredField}
        maxLength={maxLength}
        rows={1}
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  );
};
