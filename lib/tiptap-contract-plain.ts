import { normalizeContractLineEndings } from "./contract-text-sanitize";

/**
 * Convierte el documento Tiptap (JSON) a texto plano con viñetas/numeración en ASCII
 * (seguro para PDF/WinAnsi y legible en el contrato). getText() de Tiptap no añade `-` ni `1.`.
 */
export type TiptapJsonDoc = {
  type?: string;
  text?: string;
  content?: TiptapJsonDoc[];
  attrs?: Record<string, unknown>;
};
type JsonNode = TiptapJsonDoc;

const flattenInline = (nodes: JsonNode[] | undefined): string => {
  if (!nodes?.length) {
    return "";
  }
  let s = "";
  for (const n of nodes) {
    if (n.type === "text" && typeof n.text === "string") {
      s += n.text;
    } else if (n.type === "hardBreak") {
      s += "\n";
    } else if (n.content) {
      s += flattenInline(n.content);
    }
  }
  return normalizeContractLineEndings(s);
};

const paragraphToPlain = (p: JsonNode): string => {
  if (p.type !== "paragraph") {
    return "";
  }
  return flattenInline(p.content);
};

const listItemBody = (li: JsonNode, baseIndent: string): string => {
  if (li.type !== "listItem" || !li.content) {
    return "";
  }
  const chunks: string[] = [];
  for (const c of li.content) {
    if (c.type === "paragraph") {
      chunks.push(paragraphToPlain(c));
    } else if (c.type === "bulletList") {
      chunks.push(bulletListToPlain(c, baseIndent + "  "));
    } else if (c.type === "orderedList") {
      const start = typeof c.attrs?.start === "number" && c.attrs.start > 0 ? c.attrs.start : 1;
      chunks.push(orderedListToPlain(c, baseIndent + "  ", start));
    }
  }
  return normalizeContractLineEndings(chunks.join("\n")).replace(/\n+$/g, "");
};

const bulletListToPlain = (node: JsonNode, indent: string): string => {
  if (node.type !== "bulletList" || !node.content) {
    return "";
  }
  const out: string[] = [];
  for (const li of node.content) {
    if (li.type !== "listItem") {
      continue;
    }
    const body = listItemBody(li, indent);
    if (!body) {
      out.push(`${indent}- `);
      continue;
    }
    const lines = normalizeContractLineEndings(body).split("\n");
    out.push(`${indent}- ${lines[0] ?? ""}`.trimEnd());
    for (let i = 1; i < lines.length; i++) {
      out.push(`${indent}  ${lines[i] ?? ""}`.trimEnd());
    }
  }
  return out.join("\n");
};

const orderedListToPlain = (node: JsonNode, indent: string, startNum: number): string => {
  if (node.type !== "orderedList" || !node.content) {
    return "";
  }
  let n =
    typeof node.attrs?.start === "number" && (node.attrs.start as number) > 0
      ? (node.attrs.start as number)
      : startNum;
  const out: string[] = [];
  for (const li of node.content) {
    if (li.type !== "listItem") {
      continue;
    }
    const body = listItemBody(li, indent);
    if (!body) {
      out.push(`${indent}${String(n)}. `);
    } else {
      const lines = normalizeContractLineEndings(body).split("\n");
      out.push(`${indent}${String(n)}. ${lines[0] ?? ""}`.trimEnd());
      for (let i = 1; i < lines.length; i++) {
        out.push(`${indent}   ${lines[i] ?? ""}`.trimEnd());
      }
    }
    n += 1;
  }
  return out.join("\n");
};

const blockToPlain = (node: JsonNode, indent: string): string => {
  if (node.type === "paragraph") {
    return paragraphToPlain(node);
  }
  if (node.type === "bulletList") {
    return bulletListToPlain(node, indent);
  }
  if (node.type === "orderedList") {
    return orderedListToPlain(node, indent, 1);
  }
  return "";
};

/** Serializa el JSON de `editor.getJSON()` a texto con `- ` y `1. 2. …` en ASCII. */
export const tiptapJsonToContractPlain = (root: TiptapJsonDoc | null | undefined): string => {
  if (!root?.content?.length) {
    return "";
  }
  const parts: string[] = [];
  for (const n of root.content) {
    const t = blockToPlain(n, "");
    if (t) {
      parts.push(t);
    }
  }
  return normalizeContractLineEndings(
    parts.join("\n\n").replace(/\n{3,}/g, "\n\n").trim()
  );
};
