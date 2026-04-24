/**
 * Convierte texto plano (borradores, pegado limpio) a HTML mínimo para Tiptap.
 * Los párrafos se separan por doble salto; dentro del párrafo, un solo salto es <br />.
 */
export const plainTextToTiptapHtml = (plain: string): string => {
  const t = plain.replace(/\r\n/g, "\n");
  if (!t.trim()) {
    return "<p></p>";
  }
  const esc = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  return t
    .split(/\n{2,}/)
    .map((block) => {
      const inner = esc(block).split("\n").join("<br />");
      return `<p>${inner}</p>`;
    })
    .join("");
};
