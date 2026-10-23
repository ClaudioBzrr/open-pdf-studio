import { PDFDocument } from "@cantoo/pdf-lib";
import type { Annotation, ProgressReporter } from "../types";
import { buildPdfWithAnnotations } from "./annotations";
import { loadPdfJs, renderPage } from "./pdf";

export interface CompressOptions {
  dpi?: number;
  quality?: number;
  password?: string;
}

export const compressPdf = async (
  bytes: Uint8Array,
  annotations: Annotation[],
  pageRotations: number[],
  options: CompressOptions = {},
  onProgress?: ProgressReporter,
): Promise<Uint8Array> => {
  const dpi = options.dpi ?? 150;
  const quality = options.quality ?? 0.72;
  const scale = dpi / 72;

  onProgress?.("Preparando o documento…", 0.03);
  const prepared = await buildPdfWithAnnotations(bytes, annotations, pageRotations, {
    password: options.password,
  });
  const source = await loadPdfJs(prepared);
  const images: Array<{ dataUrl: string; width: number; height: number }> = [];
  try {
    for (let pageNumber = 1; pageNumber <= source.numPages; pageNumber += 1) {
      onProgress?.(`Convertendo página ${pageNumber} de ${source.numPages}…`, 0.06 + (pageNumber / source.numPages) * 0.78);
      const { canvas, viewport } = await renderPage(source, pageNumber, scale, 0);
      images.push({
        dataUrl: canvas.toDataURL("image/jpeg", quality),
        width: viewport.width / scale,
        height: viewport.height / scale,
      });
    }
  } finally {
    await source.destroy();
  }

  onProgress?.("Montando o PDF comprimido…", 0.9);
  const target = await PDFDocument.create();
  for (const image of images) {
    const embedded = await target.embedJpg(image.dataUrl);
    const page = target.addPage([image.width, image.height]);
    page.drawImage(embedded, { x: 0, y: 0, width: image.width, height: image.height });
  }
  target.setCreator("OpenPDF Studio");
  target.setProducer("OpenPDF Studio");
  onProgress?.("Compressão concluída.", 1);
  return target.save({ useObjectStreams: true });
};
