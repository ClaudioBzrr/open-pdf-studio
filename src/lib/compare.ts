import type { PDFDocumentProxy } from "pdfjs-dist";
import type { ComparePageResult, ProgressReporter } from "../types";
import { renderPage } from "./pdf";

const renderBitmap = async (pdf: PDFDocumentProxy, pageNumber: number, width: number) => {
  const page = await pdf.getPage(pageNumber);
  const base = page.getViewport({ scale: 1 });
  const scale = width / base.width;
  const { canvas } = await renderPage(pdf, pageNumber, scale, 0);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D indisponível.");
  return {
    canvas,
    data: context.getImageData(0, 0, canvas.width, canvas.height),
    width: canvas.width,
    height: canvas.height,
  };
};

export const comparePdfs = async (
  before: PDFDocumentProxy,
  after: PDFDocumentProxy,
  onProgress?: ProgressReporter,
  maxPages = 30,
): Promise<ComparePageResult[]> => {
  const total = Math.min(Math.max(before.numPages, after.numPages), maxPages);
  const results: ComparePageResult[] = [];
  for (let pageNumber = 1; pageNumber <= total; pageNumber += 1) {
    onProgress?.(`Comparando página ${pageNumber} de ${total}…`, (pageNumber - 1) / total);
    const beforePage = pageNumber <= before.numPages
      ? await renderBitmap(before, pageNumber, 900)
      : null;
    const afterPage = pageNumber <= after.numPages
      ? await renderBitmap(after, pageNumber, 900)
      : null;
    const width = Math.max(beforePage?.width ?? 0, afterPage?.width ?? 0);
    const height = Math.max(beforePage?.height ?? 0, afterPage?.height ?? 0);
    const normalize = (source: { canvas: HTMLCanvasElement } | null) => {
      if (!source) return null;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) return null;
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      context.drawImage(source.canvas, 0, 0);
      return canvas;
    };
    const beforeCanvas = normalize(beforePage);
    const afterCanvas = normalize(afterPage);
    const diffCanvas = document.createElement("canvas");
    diffCanvas.width = width;
    diffCanvas.height = height;
    const diffContext = diffCanvas.getContext("2d");
    if (!diffContext) throw new Error("Canvas 2D indisponível.");
    diffContext.fillStyle = "#ffffff";
    diffContext.fillRect(0, 0, width, height);
    if (afterCanvas) diffContext.drawImage(afterCanvas, 0, 0);

    const beforeContext = beforeCanvas?.getContext("2d");
    const afterContext = afterCanvas?.getContext("2d");
    let differentPixels = 0;
    const totalPixels = width * height;
    if (beforeContext && afterContext) {
      const beforeData = beforeContext.getImageData(0, 0, width, height).data;
      const afterData = afterContext.getImageData(0, 0, width, height).data;
      const output = diffContext.getImageData(0, 0, width, height);
      for (let index = 0; index < beforeData.length; index += 4) {
        const beforeLuma = beforeData[index] * 0.299 + beforeData[index + 1] * 0.587 + beforeData[index + 2] * 0.114;
        const afterLuma = afterData[index] * 0.299 + afterData[index + 1] * 0.587 + afterData[index + 2] * 0.114;
        if (Math.abs(beforeLuma - afterLuma) > 22) {
          differentPixels += 1;
          output.data[index] = 239;
          output.data[index + 1] = 68;
          output.data[index + 2] = 68;
          output.data[index + 3] = 255;
        }
      }
      diffContext.putImageData(output, 0, 0);
    } else {
      differentPixels = totalPixels;
    }
    results.push({
      page: pageNumber,
      width,
      height,
      differentPixels,
      totalPixels,
      similarity: Math.max(0, 1 - differentPixels / Math.max(1, totalPixels)),
      beforeUrl: beforeCanvas?.toDataURL("image/png") ?? "",
      afterUrl: afterCanvas?.toDataURL("image/png") ?? "",
      diffUrl: diffCanvas.toDataURL("image/png"),
    });
  }
  onProgress?.("Comparação concluída.", 1);
  return results;
};
