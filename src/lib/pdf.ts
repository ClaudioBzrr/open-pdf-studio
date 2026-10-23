import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import { PDFDocument } from "@cantoo/pdf-lib";
import type { OutlineNode, PdfMetadata } from "../types";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export { pdfjsLib };
export type { PDFDocumentProxy, PDFPageProxy };

export class PasswordRequiredError extends Error {
  constructor() {
    super("Este PDF está protegido por senha.");
    this.name = "PasswordRequiredError";
  }
}

export const loadPdfJs = async (bytes: Uint8Array, password?: string): Promise<PDFDocumentProxy> => {
  const data = new Uint8Array(bytes);
  const task = pdfjsLib.getDocument({
    data,
    password,
    useWorkerFetch: false,
    disableFontFace: false,
  });
  try {
    return await task.promise;
  } catch (error) {
    const name = (error as { name?: string })?.name;
    if (name === "PasswordException") {
      throw new PasswordRequiredError();
    }
    throw error;
  }
};

export const loadPdfLib = async (bytes: Uint8Array, password?: string) => {
  try {
    return await PDFDocument.load(new Uint8Array(bytes), {
      password,
      updateMetadata: false,
      throwOnInvalidObject: false,
    });
  } catch (error) {
    const message = String((error as Error)?.message ?? error);
    if (/password|encrypt/i.test(message)) {
      throw new PasswordRequiredError();
    }
    throw error;
  }
};

export const renderPage = async (
  pdf: PDFDocumentProxy,
  pageNumber: number,
  scale: number,
  rotation = 0,
): Promise<{ canvas: HTMLCanvasElement; page: PDFPageProxy; viewport: ReturnType<PDFPageProxy["getViewport"]> }> => {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale, rotation: page.rotate + rotation });
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("Canvas 2D não está disponível neste navegador.");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: context, viewport, canvas }).promise;
  return { canvas, page, viewport };
};

export const renderPageToDataUrl = async (
  pdf: PDFDocumentProxy,
  pageNumber: number,
  scale: number,
  rotation = 0,
  type: "image/png" | "image/jpeg" = "image/png",
  quality = 0.9,
): Promise<{ dataUrl: string; width: number; height: number }> => {
  const { canvas, viewport } = await renderPage(pdf, pageNumber, scale, rotation);
  const dataUrl = canvas.toDataURL(type, quality);
  return { dataUrl, width: viewport.width, height: viewport.height };
};

export const getPageText = async (
  pdf: PDFDocumentProxy,
  pageNumber: number,
): Promise<string> => {
  const page = await pdf.getPage(pageNumber);
  const content = await page.getTextContent();
  return content.items
    .map((item) => ("str" in item ? item.str : ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
};

export interface SearchHit {
  pageNumber: number;
  snippet: string;
  index: number;
}

export interface SearchBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const findSearchBoxes = async (
  pdf: PDFDocumentProxy,
  pageNumber: number,
  query: string,
): Promise<SearchBox[]> => {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  const page = await pdf.getPage(pageNumber);
  const content = await page.getTextContent();
  const [x0, y0, x1, y1] = page.view;
  const pageWidth = x1 - x0;
  const pageHeight = y1 - y0;
  const boxes: SearchBox[] = [];
  for (const item of content.items) {
    if (!("str" in item) || !item.str) continue;
    if (!item.str.toLowerCase().includes(needle)) continue;
    const transform = item.transform;
    const pdfX = transform[4] ?? 0;
    const pdfY = transform[5] ?? 0;
    boxes.push({
      x: (pdfX - x0) / pageWidth,
      y: (pdfY - y0) / pageHeight,
      width: Math.max(0.002, (item.width ?? 0) / pageWidth),
      height: Math.max(0.002, (item.height ?? 8) / pageHeight),
    });
  }
  return boxes;
};

export const searchDocument = async (
  pdf: PDFDocumentProxy,
  query: string,
  onProgress?: (page: number, total: number) => void,
): Promise<SearchHit[]> => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  const hits: SearchHit[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const text = await getPageText(pdf, pageNumber);
    const haystack = text.toLowerCase();
    let from = 0;
    while (from < haystack.length) {
      const index = haystack.indexOf(normalized, from);
      if (index === -1) break;
      const start = Math.max(0, index - 45);
      const end = Math.min(text.length, index + normalized.length + 65);
      hits.push({
        pageNumber,
        snippet: `${start > 0 ? "…" : ""}${text.slice(start, end)}${end < text.length ? "…" : ""}`,
        index,
      });
      from = index + Math.max(1, normalized.length);
    }
    onProgress?.(pageNumber, pdf.numPages);
  }
  return hits;
};

const resolveOutline = async (
  pdf: PDFDocumentProxy,
  items: Array<{ title: string; dest?: string | unknown[] | null; items?: unknown[] }>,
): Promise<OutlineNode[]> => {
  const nodes: OutlineNode[] = [];
  for (const item of items) {
    let pageIndex: number | null = null;
    try {
      if (typeof item.dest === "string") {
        const destination = await pdf.getDestination(item.dest);
        if (destination) {
          const ref = destination[0];
          if (ref && typeof ref === "object") {
            pageIndex = await pdf.getPageIndex(ref as never);
          }
        }
      } else if (Array.isArray(item.dest)) {
        const ref = item.dest[0];
        if (ref && typeof ref === "object") {
          pageIndex = await pdf.getPageIndex(ref as never);
        }
      }
    } catch {
      pageIndex = null;
    }
    const children = Array.isArray(item.items)
      ? await resolveOutline(pdf, item.items as never[])
      : [];
    nodes.push({ title: item.title || "Sem título", pageIndex, children });
  }
  return nodes;
};

export const getOutline = async (pdf: PDFDocumentProxy): Promise<OutlineNode[]> => {
  try {
    const outline = await pdf.getOutline();
    if (!outline) return [];
    return await resolveOutline(pdf, outline as never[]);
  } catch {
    return [];
  }
};

export const getMetadata = async (pdf: PDFDocumentProxy): Promise<PdfMetadata> => {
  try {
    const result = await pdf.getMetadata();
    const info = (result.info ?? {}) as Record<string, unknown>;
    const stringValue = (key: string): string | undefined => {
      const value = info[key];
      return typeof value === "string" && value.trim() ? value : undefined;
    };
    return {
      title: stringValue("Title"),
      author: stringValue("Author"),
      subject: stringValue("Subject"),
      keywords: stringValue("Keywords"),
      creator: stringValue("Creator"),
      producer: stringValue("Producer"),
      creationDate: stringValue("CreationDate"),
      modificationDate: stringValue("ModDate"),
    };
  } catch {
    return {};
  }
};

export const countFormFields = async (bytes: Uint8Array, password?: string): Promise<number> => {
  try {
    const document = await loadPdfLib(bytes, password);
    return document.getForm().getFields().length;
  } catch {
    return 0;
  }
};
