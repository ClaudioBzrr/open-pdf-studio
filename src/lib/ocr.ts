import type { PDFDocumentProxy } from "pdfjs-dist";
import { PDFDocument, StandardFonts, rgb } from "@cantoo/pdf-lib";
import type { ProgressReporter } from "../types";
import { renderPage } from "./pdf";

export type OcrLanguage = "eng" | "por" | "eng+por";

export interface OcrPageResult {
  pageNumber: number;
  text: string;
  words: Array<{ text: string; confidence: number; bbox: { x0: number; y0: number; x1: number; y1: number } }>;
}

export interface OcrResult {
  pages: OcrPageResult[];
  text: string;
}

let workerPromise: Promise<import("tesseract.js").Worker> | null = null;
let workerLanguage = "";

const getWorker = async (language: OcrLanguage, onProgress?: ProgressReporter) => {
  if (workerPromise && workerLanguage === language) return workerPromise;
  if (workerPromise) {
    const previous = await workerPromise;
    await previous.terminate();
    workerPromise = null;
  }
  const { createWorker, OEM } = await import("tesseract.js");
  workerLanguage = language;
  const base = import.meta.env.BASE_URL;
  workerPromise = createWorker(language, OEM.LSTM_ONLY, {
    workerPath: `${base}vendor/tesseract/worker.min.js`,
    corePath: `${base}vendor/tesseract`,
    langPath: `${base}tessdata`,
    gzip: true,
    logger: (message) => {
      if (message.status === "recognizing text") {
        onProgress?.("Reconhecendo texto…", message.progress);
      } else if (message.status) {
        onProgress?.(message.status, message.progress);
      }
    },
  });
  return workerPromise;
};

export const recognizePages = async (
  pdf: PDFDocumentProxy,
  pageNumbers: number[],
  language: OcrLanguage,
  onProgress?: ProgressReporter,
): Promise<OcrResult> => {
  const worker = await getWorker(language, onProgress);
  const pages: OcrPageResult[] = [];
  for (let index = 0; index < pageNumbers.length; index += 1) {
    const pageNumber = pageNumbers[index];
    onProgress?.(`OCR da página ${pageNumber} (${index + 1}/${pageNumbers.length})…`, index / Math.max(1, pageNumbers.length));
    const { canvas } = await renderPage(pdf, pageNumber, 2, 0);
    const result = await worker.recognize(canvas, {}, { text: true, blocks: true });
    const words = (result.data.blocks ?? [])
      .flatMap((block) => block.paragraphs)
      .flatMap((paragraph) => paragraph.lines)
      .flatMap((line) => line.words)
      .map((word) => ({
        text: word.text,
        confidence: word.confidence,
        bbox: word.bbox,
      }));
    pages.push({ pageNumber, text: result.data.text ?? "", words });
  }
  onProgress?.("OCR concluído.", 1);
  return {
    pages,
    text: pages
      .map((page) => `--- Página ${page.pageNumber} ---\n${page.text.trim()}`)
      .join("\n\n"),
  };
};

/**
 * Add an invisible, selectable text layer from OCR word boxes. The original
 * page image remains untouched; text is positioned in PDF coordinates so it
 * follows the page's existing rotation.
 */
export const createSearchablePdf = async (
  sourceBytes: Uint8Array,
  pdf: PDFDocumentProxy,
  result: OcrResult,
  password?: string,
): Promise<Uint8Array> => {
  if (result.pages.length === 0) throw new Error("Execute o OCR antes de gerar o PDF pesquisável.");
  const document = await PDFDocument.load(new Uint8Array(sourceBytes), {
    password,
    updateMetadata: false,
    throwOnInvalidObject: false,
  });
  const font = await document.embedFont(StandardFonts.Helvetica);
  for (const pageResult of result.pages) {
    const targetPage = document.getPage(pageResult.pageNumber - 1);
    const sourcePage = await pdf.getPage(pageResult.pageNumber);
    const viewport = sourcePage.getViewport({ scale: 2, rotation: sourcePage.rotate });
    for (const word of pageResult.words) {
      if (word.confidence < 25 || !word.text.trim()) continue;
      const safeText = word.text.replace(/[^\x20-\x7E\u00A0-\u00FF]/g, "?").trim();
      if (!safeText) continue;
      const [left, bottom] = viewport.convertToPdfPoint(word.bbox.x0, word.bbox.y1);
      const [right, top] = viewport.convertToPdfPoint(word.bbox.x1, word.bbox.y0);
      const x = Math.min(left, right);
      const y = Math.min(bottom, top);
      const size = Math.max(4, Math.abs(top - bottom) * 0.82);
      try {
        targetPage.drawText(safeText, {
          x,
          y,
          size,
          font,
          color: rgb(0, 0, 0),
          opacity: 0,
        });
      } catch {
        // Ignore words whose glyphs cannot be encoded by the standard font.
      }
    }
  }
  return document.save({ useObjectStreams: true });
};

export const terminateOcr = async (): Promise<void> => {
  if (!workerPromise) return;
  const worker = await workerPromise;
  workerPromise = null;
  workerLanguage = "";
  await worker.terminate();
};
