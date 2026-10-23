import {
  BlendMode,
  PDFDocument,
  StandardFonts,
  degrees,
  rgb,
  type PDFFont,
  type PDFImage,
  type PDFPage,
} from "@cantoo/pdf-lib";
import type { Annotation, ImageAnnotation, RectAnnotation, TextAnnotation } from "../types";
import { dataUrlToBytes, hexToRgb } from "./utils";

const colorFor = (hex: string, opacity = 1) => {
  const { r, g, b } = hexToRgb(hex);
  return rgb(r, g, b);
};

const drawWrappedText = (
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  font: PDFFont,
  size: number,
  color: ReturnType<typeof rgb>,
  opacity: number,
): void => {
  const lines: string[] = [];
  for (const paragraph of text.replace(/\r\n/g, "\n").split("\n")) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth || !current) {
        current = candidate;
      } else {
        lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
  }
  const lineHeight = size * 1.3;
  lines.forEach((line, index) => {
    page.drawText(line, {
      x,
      y: y - size - index * lineHeight,
      size,
      font,
      color,
      opacity,
    });
  });
};

const drawArrowHead = (
  page: PDFPage,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: ReturnType<typeof rgb>,
  opacity: number,
  thickness: number,
): void => {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const length = Math.max(6, thickness * 4.5);
  const spread = Math.PI / 7;
  page.drawLine({
    start: { x: x2, y: y2 },
    end: { x: x2 - length * Math.cos(angle - spread), y: y2 - length * Math.sin(angle - spread) },
    thickness,
    color,
    opacity,
  });
  page.drawLine({
    start: { x: x2, y: y2 },
    end: { x: x2 - length * Math.cos(angle + spread), y: y2 - length * Math.sin(angle + spread) },
    thickness,
    color,
    opacity,
  });
};

const embedAnnotationImage = async (
  document: PDFDocument,
  annotation: ImageAnnotation,
): Promise<PDFImage | null> => {
  try {
    const bytes = dataUrlToBytes(annotation.dataUrl);
    if (annotation.dataUrl.startsWith("data:image/jpeg") || annotation.dataUrl.startsWith("data:image/jpg")) {
      return await document.embedJpg(bytes);
    }
    return await document.embedPng(bytes);
  } catch {
    return null;
  }
};

export const drawAnnotationsOnPage = async (
  document: PDFDocument,
  page: PDFPage,
  pageIndex: number,
  annotations: Annotation[],
  pageRotation: number,
  font: PDFFont,
): Promise<void> => {
  const pageWidth = page.getWidth();
  const pageHeight = page.getHeight();
  const pageAnnotations = annotations.filter((annotation) => annotation.pageIndex === pageIndex);

  for (const annotation of pageAnnotations) {
    const color = colorFor(annotation.color, annotation.opacity);
    if (annotation.type === "highlight" || annotation.type === "rect" || annotation.type === "whiteout" || annotation.type === "redact") {
      const rect = annotation as RectAnnotation;
      const x = rect.x * pageWidth;
      const y = rect.y * pageHeight;
      const width = Math.max(1, rect.width * pageWidth);
      const height = Math.max(1, rect.height * pageHeight);
      if (annotation.type === "highlight") {
        page.drawRectangle({
          x,
          y,
          width,
          height,
          color,
          opacity: Math.min(0.65, Math.max(0.15, annotation.opacity)),
          blendMode: BlendMode.Multiply,
        });
      } else if (annotation.type === "whiteout") {
        page.drawRectangle({ x, y, width, height, color: rgb(1, 1, 1), opacity: 1 });
      } else if (annotation.type === "redact") {
        page.drawRectangle({ x, y, width, height, color: rgb(0, 0, 0), opacity: 1 });
      } else {
        page.drawRectangle({
          x,
          y,
          width,
          height,
          borderColor: color,
          borderWidth: Math.max(0.75, 1.5),
          opacity: 0,
        });
      }
      continue;
    }

    if (annotation.type === "underline" || annotation.type === "strikeout") {
      const rect = annotation as RectAnnotation;
      const x = rect.x * pageWidth;
      const width = Math.max(1, rect.width * pageWidth);
      const y = rect.y * pageHeight + (annotation.type === "underline" ? 1.5 : rect.height * pageHeight * 0.45);
      page.drawLine({
        start: { x, y },
        end: { x: x + width, y },
        thickness: Math.max(0.8, 1.2),
        color,
        opacity: Math.max(0.6, annotation.opacity),
      });
      continue;
    }

    if (annotation.type === "pen") {
      const points = annotation.points;
      for (let index = 1; index < points.length; index += 1) {
        page.drawLine({
          start: { x: points[index - 1].x * pageWidth, y: points[index - 1].y * pageHeight },
          end: { x: points[index].x * pageWidth, y: points[index].y * pageHeight },
          thickness: Math.max(0.5, annotation.strokeWidth),
          color,
          opacity: annotation.opacity,
          lineCap: 1,
        });
      }
      continue;
    }

    if (annotation.type === "arrow") {
      const x1 = annotation.x1 * pageWidth;
      const y1 = annotation.y1 * pageHeight;
      const x2 = annotation.x2 * pageWidth;
      const y2 = annotation.y2 * pageHeight;
      page.drawLine({
        start: { x: x1, y: y1 },
        end: { x: x2, y: y2 },
        thickness: Math.max(0.5, annotation.strokeWidth),
        color,
        opacity: annotation.opacity,
      });
      drawArrowHead(page, x1, y1, x2, y2, color, annotation.opacity, annotation.strokeWidth);
      continue;
    }

    if (annotation.type === "text" || annotation.type === "note") {
      const text = annotation as TextAnnotation;
      if (!text.text.trim()) continue;
      const x = text.x * pageWidth;
      const width = Math.max(24, text.width * pageWidth);
      const topY = (text.y + text.height) * pageHeight;
      if (annotation.type === "note") {
        const height = Math.max(24, text.height * pageHeight);
        page.drawRectangle({
          x,
          y: topY - height,
          width,
          height,
          color: rgb(1, 0.97, 0.75),
          borderColor: rgb(0.78, 0.62, 0.1),
          borderWidth: 0.8,
          opacity: 0.95,
        });
        page.drawText("N", {
          x: x + 4,
          y: topY - 12,
          size: 9,
          font,
          color: rgb(0.45, 0.32, 0.02),
        });
      }
      const padding = annotation.type === "note" ? 14 : 0;
      drawWrappedText(
        page,
        text.text,
        x + (annotation.type === "note" ? 4 : 0),
        topY - padding,
        width - 8,
        font,
        Math.max(5, text.fontSize),
        color,
        annotation.opacity,
      );
      continue;
    }

    if (annotation.type === "image" || annotation.type === "signature") {
      const image = annotation as ImageAnnotation;
      const embedded = await embedAnnotationImage(document, image);
      if (!embedded) continue;
      const x = image.x * pageWidth;
      const y = image.y * pageHeight;
      const width = Math.max(8, image.width * pageWidth);
      const height = Math.max(8, image.height * pageHeight);
      page.drawImage(embedded, { x, y, width, height, opacity: annotation.opacity });
    }
  }

  if (pageRotation !== 0) {
    const current = page.getRotation().angle;
    page.setRotation(degrees((current + pageRotation) % 360));
  }
};

export const buildPdfWithAnnotations = async (
  sourceBytes: Uint8Array,
  annotations: Annotation[],
  pageRotations: number[],
  options: { password?: string; includeRedactions?: boolean } = {},
): Promise<Uint8Array> => {
  const document = await PDFDocument.load(new Uint8Array(sourceBytes), {
    password: options.password,
    updateMetadata: false,
    throwOnInvalidObject: false,
  });
  const font = await document.embedFont(StandardFonts.Helvetica);
  const annotationsToDraw = options.includeRedactions === false
    ? annotations.filter((annotation) => annotation.type !== "redact")
    : annotations;
  const pages = document.getPages();
  for (let index = 0; index < pages.length; index += 1) {
    await drawAnnotationsOnPage(document, pages[index], index, annotationsToDraw, pageRotations[index] ?? 0, font);
  }
  return document.save({ useObjectStreams: true });
};

export const annotationLabel = (annotation: Annotation): string => {
  switch (annotation.type) {
    case "highlight":
      return "Marca-texto";
    case "underline":
      return "Sublinhado";
    case "strikeout":
      return "Tachado";
    case "note":
      return "Comentário";
    case "pen":
      return "Desenho";
    case "rect":
      return "Retângulo";
    case "arrow":
      return "Seta";
    case "text":
      return "Texto";
    case "redact":
      return "Redação";
    case "whiteout":
      return "Cobertura";
    case "image":
      return "Imagem";
    case "signature":
      return "Assinatura";
    default:
      return "Anotação";
  }
};

export const annotationSummary = (annotation: Annotation): string => {
  if (annotation.type === "text" || annotation.type === "note") {
    return annotation.text.slice(0, 80) || "Sem texto";
  }
  if (annotation.type === "redact") return "Área marcada para remoção";
  if (annotation.type === "signature") return "Assinatura visual";
  return "Página {n}";
};
