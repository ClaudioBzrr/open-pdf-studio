export type ToolId =
  | "select"
  | "highlight"
  | "underline"
  | "strikeout"
  | "note"
  | "pen"
  | "rect"
  | "arrow"
  | "text"
  | "redact"
  | "whiteout"
  | "image"
  | "signature";

export type AnnotationType = Exclude<ToolId, "select">;

export interface AnnotationBase {
  id: string;
  pageIndex: number;
  type: AnnotationType;
  color: string;
  opacity: number;
  createdAt: number;
}

export interface RectAnnotation extends AnnotationBase {
  type: "highlight" | "underline" | "strikeout" | "rect" | "redact" | "whiteout";
  /** Normalized PDF coordinates: origin bottom-left, 0..1. */
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PathAnnotation extends AnnotationBase {
  type: "pen";
  points: Array<{ x: number; y: number }>;
  strokeWidth: number;
}

export interface ArrowAnnotation extends AnnotationBase {
  type: "arrow";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  strokeWidth: number;
}

export interface TextAnnotation extends AnnotationBase {
  type: "text" | "note";
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize: number;
}

export interface ImageAnnotation extends AnnotationBase {
  type: "image" | "signature";
  x: number;
  y: number;
  width: number;
  height: number;
  dataUrl: string;
  label?: string;
}

export type Annotation =
  | RectAnnotation
  | PathAnnotation
  | ArrowAnnotation
  | TextAnnotation
  | ImageAnnotation;

export interface OutlineNode {
  title: string;
  pageIndex: number | null;
  children: OutlineNode[];
}

export interface PdfMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
  modificationDate?: string;
}

export interface FormFieldDescriptor {
  name: string;
  type: "text" | "checkbox" | "radio" | "dropdown" | "option-list" | "button" | "unknown";
  value: string;
  checked?: boolean;
  options?: string[];
  multiline?: boolean;
  readOnly?: boolean;
  required?: boolean;
}

export interface PageOperationResult {
  bytes: Uint8Array;
  pageCount: number;
}

export interface ProgressReporter {
  (message: string, value?: number): void;
}

export interface ComparePageResult {
  page: number;
  width: number;
  height: number;
  differentPixels: number;
  totalPixels: number;
  similarity: number;
  beforeUrl: string;
  afterUrl: string;
  diffUrl: string;
}
