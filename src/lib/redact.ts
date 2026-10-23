import { PDFDocument } from "@cantoo/pdf-lib";
import type { Annotation, ProgressReporter, RectAnnotation } from "../types";
import { buildPdfWithAnnotations } from "./annotations";
import { loadPdfJs, renderPage } from "./pdf";

export interface RedactionOptions {
  dpi?: number;
  quality?: number;
  password?: string;
  stripMetadata?: boolean;
}

export const applyRedactions = async (
  bytes: Uint8Array,
  annotations: Annotation[],
  pageRotations: number[],
  options: RedactionOptions = {},
  onProgress?: ProgressReporter,
): Promise<Uint8Array> => {
  const redactions = annotations.filter(
    (annotation): annotation is RectAnnotation => annotation.type === "redact",
  );
  if (redactions.length === 0) throw new Error("Marque pelo menos uma área de redação.");
  const dpi = options.dpi ?? 200;
  const scale = dpi / 72;
  const quality = options.quality ?? 0.92;

  onProgress?.("Aplicando anotações antes da redação…", 0.03);
  const prepared = await buildPdfWithAnnotations(bytes, annotations, pageRotations, {
    password: options.password,
    includeRedactions: false,
  });
  const source = await loadPdfJs(prepared);
  const rendered = new Map<number, { dataUrl: string; width: number; height: number }>();

  try {
    for (let pageNumber = 1; pageNumber <= source.numPages; pageNumber += 1) {
      const pageRedactions = redactions.filter((annotation) => annotation.pageIndex === pageNumber - 1);
      if (pageRedactions.length === 0) continue;
      onProgress?.(`Rasterizando página ${pageNumber} para remoção segura…`, 0.08 + (pageNumber / source.numPages) * 0.65);
      const { canvas, page, viewport } = await renderPage(source, pageNumber, scale, 0);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas 2D indisponível.");
      const [x0, y0, x1, y1] = page.view;
      const pdfWidth = x1 - x0;
      const pdfHeight = y1 - y0;
      context.fillStyle = "#000000";
      for (const annotation of pageRedactions) {
        const x = x0 + annotation.x * pdfWidth;
        const y = y0 + annotation.y * pdfHeight;
        const width = annotation.width * pdfWidth;
        const height = annotation.height * pdfHeight;
        const topLeft = viewport.convertToViewportPoint(x, y + height);
        const bottomRight = viewport.convertToViewportPoint(x + width, y);
        const left = Math.min(topLeft[0], bottomRight[0]);
        const top = Math.min(topLeft[1], bottomRight[1]);
        const boxWidth = Math.abs(bottomRight[0] - topLeft[0]);
        const boxHeight = Math.abs(bottomRight[1] - topLeft[1]);
        context.fillRect(left, top, boxWidth, boxHeight);
      }
      rendered.set(pageNumber - 1, {
        dataUrl: canvas.toDataURL("image/jpeg", quality),
        width: viewport.width / scale,
        height: viewport.height / scale,
      });
    }
  } finally {
    await source.destroy();
  }

  onProgress?.("Montando o PDF redigido…", 0.82);
  const original = await PDFDocument.load(new Uint8Array(prepared), {
    password: options.password,
    updateMetadata: false,
    throwOnInvalidObject: false,
  });
  const target = await PDFDocument.create();
  for (let index = 0; index < original.getPageCount(); index += 1) {
    const raster = rendered.get(index);
    if (raster) {
      const image = await target.embedJpg(raster.dataUrl);
      const page = target.addPage([raster.width, raster.height]);
      page.drawImage(image, { x: 0, y: 0, width: raster.width, height: raster.height });
    } else {
      const [copied] = await target.copyPages(original, [index]);
      target.addPage(copied);
    }
  }
  if (options.stripMetadata !== false) {
    target.setTitle("");
    target.setAuthor("");
    target.setSubject("");
    target.setKeywords([]);
    target.setCreator("OpenPDF Studio");
    target.setProducer("OpenPDF Studio");
  }
  onProgress?.("Redação concluída.", 1);
  return target.save({ useObjectStreams: true });
};
