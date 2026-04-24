/**
 * Limpia texto para contrato/PDF (compartido cliente y servidor). Ver `desarrollo-software`.
 * Sustituye glifos de viñeta/punto Unicode frecuentes: en PDF (Times/WinAnsi) a veces se ven como «Ð» u otro.
 *
 * **CR/LF:** un `\r` suelto (p. ej. al partir `a\r\nb` con `split("\n")` queda `a\r`) a veces se imprime
 * al final de línea con aspecto de «Ð» en el PDF. Normalizar a solo `\n` evita eso.
 */
export const normalizeContractLineEndings = (s: string): string => s.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

export const sanitizeContractText = (s: string): string =>
  normalizeContractLineEndings(s)
    .normalize("NFC")
    .replace(/[\u2022\u2023\u25E6\u25AA\u25CF\u2043\u2219\uf0b7\uf0a7]/g, "-")
    .replace(/\u00ad/g, "")
    .replace(/[\u200b\u200c\u200d\u2060\ufeff]/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/\u2011/g, "\u002d")
    .replace(/[\u00d0\u00f0]/g, "");
