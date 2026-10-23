import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { TextLayer } from "pdfjs-dist";
import type { PDFPageProxy, PDFDocumentProxy } from "pdfjs-dist";
import type { Annotation, ToolId } from "../types";
import { clamp, uid } from "../lib/utils";
import { useI18n } from "../i18n";

interface Props {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  rotation: number;
  annotations: Annotation[];
  tool: ToolId;
  color: string;
  strokeWidth: number;
  opacity: number;
  fontSize: number;
  selectedId: string | null;
  searchBoxes: Array<{ x: number; y: number; width: number; height: number }>;
  pendingAsset: string | null;
  onAdd: (annotation: Annotation) => void;
  onUpdate: (id: string, patch: Partial<Annotation>) => void;
  onSelect: (id: string | null) => void;
}

type Viewport = ReturnType<PDFPageProxy["getViewport"]>;
type Point = { x: number; y: number };

const defaultText = "Clique para editar";

const annotationBounds = (annotation: Annotation): { x: number; y: number; width: number; height: number } => {
  if (annotation.type === "pen") {
    const xs = annotation.points.map((point) => point.x);
    const ys = annotation.points.map((point) => point.y);
    return {
      x: Math.min(...xs),
      y: Math.min(...ys),
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys),
    };
  }
  if (annotation.type === "arrow") {
    return {
      x: Math.min(annotation.x1, annotation.x2),
      y: Math.min(annotation.y1, annotation.y2),
      width: Math.abs(annotation.x2 - annotation.x1),
      height: Math.abs(annotation.y2 - annotation.y1),
    };
  }
  return { x: annotation.x, y: annotation.y, width: annotation.width, height: annotation.height };
};

const isRectTool = (tool: ToolId): boolean =>
  tool === "highlight" || tool === "underline" || tool === "strikeout" || tool === "rect" || tool === "redact" || tool === "whiteout";

export const PageCanvas = ({
  pdf,
  pageNumber,
  scale,
  rotation,
  annotations,
  tool,
  color,
  strokeWidth,
  opacity,
  fontSize,
  selectedId,
  searchBoxes,
  pendingAsset,
  onAdd,
  onUpdate,
  onSelect,
}: Props) => {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);
  const [page, setPage] = useState<PDFPageProxy | null>(null);
  const [viewport, setViewport] = useState<Viewport | null>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Annotation | null>(null);
  const startPoint = useRef<Point | null>(null);
  const penPoints = useRef<Point[]>([]);
  const moveRef = useRef<{ id: string; start: Point; original: Annotation } | null>(null);
  const [pageBox, setPageBox] = useState({ width: 1, height: 1, x0: 0, y0: 0 });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setDraft(null);
    const load = async () => {
      const loadedPage = await pdf.getPage(pageNumber);
      if (cancelled) return;
      const nextViewport = loadedPage.getViewport({ scale, rotation: loadedPage.rotate + rotation });
      setPage(loadedPage);
      setViewport(nextViewport);
      const [x0, y0, x1, y1] = loadedPage.view;
      setPageBox({ x0, y0, width: x1 - x0, height: y1 - y0 });
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = Math.max(1, Math.floor(nextViewport.width));
      canvas.height = Math.max(1, Math.floor(nextViewport.height));
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) return;
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      renderTaskRef.current?.cancel();
      const task = loadedPage.render({ canvasContext: context, viewport: nextViewport, canvas });
      renderTaskRef.current = task;
      try {
        await task.promise;
      } catch (error) {
        if ((error as { name?: string })?.name !== "RenderingCancelledException") {
          console.error(error);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load().catch((error) => {
      console.error(error);
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel();
    };
  }, [pdf, pageNumber, scale, rotation]);

  useEffect(() => {
    if (!page || !viewport) return;
    const container = textLayerRef.current;
    if (!container) return;
    let cancelled = false;
    let layer: TextLayer | null = null;
    const renderText = async () => {
      container.replaceChildren();
      container.style.setProperty("--total-scale-factor", String(scale));
      const textContent = await page.getTextContent();
      if (cancelled) return;
      layer = new TextLayer({ textContentSource: textContent, container, viewport });
      await layer.render();
    };
    renderText().catch((error) => {
      if ((error as { name?: string })?.name !== "AbortException") console.error(error);
    });
    return () => {
      cancelled = true;
      layer?.cancel();
    };
  }, [page, viewport, scale]);

  const pageWidth = pageBox.width;
  const pageHeight = pageBox.height;

  const clientToPdfPoint = (clientX: number, clientY: number): Point => {
    const svg = svgRef.current;
    if (!svg || !viewport) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const [pdfX, pdfY] = viewport.convertToPdfPoint(clientX - rect.left, clientY - rect.top);
    return {
      x: (pdfX - pageBox.x0) / pageWidth,
      y: (pdfY - pageBox.y0) / pageHeight,
    };
  };

  const toPdfPoint = (event: ReactPointerEvent<SVGSVGElement>): Point =>
    clientToPdfPoint(event.clientX, event.clientY);

  const toViewportPoint = (point: Point): [number, number] => {
    if (!viewport) return [0, 0];
    const converted = viewport.convertToViewportPoint(
      pageBox.x0 + point.x * pageWidth,
      pageBox.y0 + point.y * pageHeight,
    );
    return [converted[0] ?? 0, converted[1] ?? 0];
  };

  const createAtPoint = (point: Point) => {
    const base = {
      id: uid(),
      pageIndex: pageNumber - 1,
      color,
      opacity,
      createdAt: Date.now(),
    };
    if (tool === "text" || tool === "note") {
      const annotation: Annotation = {
        ...base,
        type: tool,
        x: point.x,
        y: point.y,
        width: tool === "note" ? 0.22 : 0.28,
        height: tool === "note" ? 0.12 : 0.06,
        text: tool === "note" ? t("Comentário") : t(defaultText),
        fontSize: tool === "note" ? 9 : fontSize,
      };
      onAdd(annotation);
      onSelect(annotation.id);
      return;
    }
    if ((tool === "image" || tool === "signature") && pendingAsset) {
      const image = new Image();
      image.onload = () => {
        const desiredWidth = tool === "signature" ? 0.28 : 0.4;
        const desiredHeight = (desiredWidth * (image.naturalHeight / Math.max(1, image.naturalWidth)) * pageWidth) / pageHeight;
        const annotation: Annotation = {
          ...base,
          type: tool,
          x: point.x,
          y: point.y,
          width: desiredWidth,
          height: desiredHeight,
          dataUrl: pendingAsset,
          label: tool === "signature" ? "Assinatura" : "Imagem",
        };
        onAdd(annotation);
        onSelect(annotation.id);
      };
      image.src = pendingAsset;
    }
  };

  const handlePointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!viewport) return;
    if (tool === "select") {
      const target = event.target as SVGElement;
      if (target === event.currentTarget) onSelect(null);
      return;
    }
    event.preventDefault();
    svgRef.current?.setPointerCapture(event.pointerId);
    const point = toPdfPoint(event);
    startPoint.current = point;
    if (tool === "pen") {
      penPoints.current = [point];
      setDraft({
        id: "draft",
        pageIndex: pageNumber - 1,
        type: "pen",
        color,
        opacity,
        createdAt: Date.now(),
        points: [point],
        strokeWidth,
      });
      return;
    }
    if (tool === "arrow") {
      setDraft({
        id: "draft",
        pageIndex: pageNumber - 1,
        type: "arrow",
        color,
        opacity,
        createdAt: Date.now(),
        x1: point.x,
        y1: point.y,
        x2: point.x,
        y2: point.y,
        strokeWidth,
      });
      return;
    }
    if (isRectTool(tool)) {
      setDraft({
        id: "draft",
        pageIndex: pageNumber - 1,
        type: tool as "highlight" | "underline" | "strikeout" | "rect" | "redact" | "whiteout",
        color,
        opacity,
        createdAt: Date.now(),
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
      });
      return;
    }
    if (tool === "text" || tool === "note" || tool === "image" || tool === "signature") {
      createAtPoint(point);
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (moveRef.current) {
      const point = clientToPdfPoint(event.clientX, event.clientY);
      const deltaX = point.x - moveRef.current.start.x;
      const deltaY = point.y - moveRef.current.start.y;
      const original = moveRef.current.original;
      if (original.type === "pen") {
        onUpdate(original.id, {
          points: original.points.map((item) => ({ x: item.x + deltaX, y: item.y + deltaY })),
        } as Partial<Annotation>);
      } else if (original.type === "arrow") {
        onUpdate(original.id, {
          x1: original.x1 + deltaX,
          y1: original.y1 + deltaY,
          x2: original.x2 + deltaX,
          y2: original.y2 + deltaY,
        } as Partial<Annotation>);
      } else {
        onUpdate(original.id, {
          x: original.x + deltaX,
          y: original.y + deltaY,
        } as Partial<Annotation>);
      }
      return;
    }
    if (!startPoint.current || !draft) return;
    const point = toPdfPoint(event);
    if (draft.type === "pen") {
      penPoints.current = [...penPoints.current, point];
      setDraft({ ...draft, points: penPoints.current });
      return;
    }
    if (draft.type === "arrow") {
      setDraft({ ...draft, x2: point.x, y2: point.y });
      return;
    }
    if ("width" in draft && "height" in draft && "x" in draft && "y" in draft) {
      setDraft({
        ...draft,
        x: Math.min(startPoint.current.x, point.x),
        y: Math.min(startPoint.current.y, point.y),
        width: Math.abs(point.x - startPoint.current.x),
        height: Math.abs(point.y - startPoint.current.y),
      });
    }
  };

  const handlePointerUp = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (moveRef.current) {
      moveRef.current = null;
      if (svgRef.current?.hasPointerCapture(event.pointerId)) {
        svgRef.current.releasePointerCapture(event.pointerId);
      }
      return;
    }
    if (draft && startPoint.current) {
      const isTiny =
        ("width" in draft && "height" in draft && draft.width < 0.004 && draft.height < 0.004) ||
        (draft.type === "pen" && draft.points.length < 2);
      if (!isTiny) {
        const { id: _draftId, ...rest } = draft;
        const annotation = { ...rest, id: uid(), createdAt: Date.now() } as Annotation;
        onAdd(annotation);
        onSelect(annotation.id);
      }
    }
    setDraft(null);
    startPoint.current = null;
    penPoints.current = [];
    if (svgRef.current?.hasPointerCapture(event.pointerId)) {
      svgRef.current.releasePointerCapture(event.pointerId);
    }
  };

  const renderedAnnotations = useMemo(
    () => (draft ? [...annotations, draft] : annotations),
    [annotations, draft],
  );

  const pageAnnotations = useMemo(
    () => renderedAnnotations.filter((annotation) => annotation.pageIndex === pageNumber - 1),
    [renderedAnnotations, pageNumber],
  );

  if (!viewport) {
    return <div className="page-placeholder">{t("Carregando página…")}</div>;
  }

  return (
    <div
      className="page-stage"
      style={{ width: viewport.width, height: viewport.height }}
    >
      <canvas ref={canvasRef} className="page-canvas" aria-label={t("Página {n}", { n: pageNumber })} />
      <div
        ref={textLayerRef}
        className={`textLayer ${tool === "select" ? "is-selectable" : ""}`}
        style={{ "--total-scale-factor": scale } as CSSProperties}
      />
      <svg
        ref={svgRef}
        className={`page-overlay tool-${tool}`}
        width={viewport.width}
        height={viewport.height}
        viewBox={`0 0 ${viewport.width} ${viewport.height}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {searchBoxes.map((box, index) => {
          const [x, y] = toViewportPoint({ x: box.x, y: box.y + box.height });
          const [x2, y2] = toViewportPoint({ x: box.x + box.width, y: box.y });
          return (
            <rect
              key={`search-${index}`}
              x={Math.min(x, x2)}
              y={Math.min(y, y2)}
              width={Math.abs(x2 - x)}
              height={Math.abs(y2 - y)}
              fill="#fde047"
              opacity={0.35}
              pointerEvents="none"
            />
          );
        })}

        {pageAnnotations.map((annotation) => {
          const selected = annotation.id === selectedId;
          const common = {
            onPointerDown: (event: ReactPointerEvent<SVGElement>) => {
              if (tool === "select") {
                event.stopPropagation();
                onSelect(annotation.id);
                if (selectedId === annotation.id) {
                  moveRef.current = {
                    id: annotation.id,
                    start: clientToPdfPoint(event.clientX, event.clientY),
                    original: annotation,
                  };
                  svgRef.current?.setPointerCapture(event.pointerId);
                }
              }
            },
            style: {
              cursor: tool === "select" ? (selected ? "grab" : "pointer") : "crosshair",
              pointerEvents: "auto",
            } as const,
          };
          if (annotation.type === "highlight" || annotation.type === "rect" || annotation.type === "whiteout" || annotation.type === "redact") {
            const [x, y] = toViewportPoint({ x: annotation.x, y: annotation.y + annotation.height });
            const [x2, y2] = toViewportPoint({ x: annotation.x + annotation.width, y: annotation.y });
            const left = Math.min(x, x2);
            const top = Math.min(y, y2);
            const width = Math.abs(x2 - x);
            const height = Math.abs(y2 - y);
            if (annotation.type === "highlight") {
              return (
                <rect
                  key={annotation.id}
                  {...common}
                  x={left}
                  y={top}
                  width={width}
                  height={height}
                  fill={annotation.color}
                  opacity={annotation.opacity}
                  style={{ ...common.style, mixBlendMode: "multiply" }}
                />
              );
            }
            if (annotation.type === "whiteout") {
              return <rect key={annotation.id} {...common} x={left} y={top} width={width} height={height} fill="#ffffff" />;
            }
            if (annotation.type === "redact") {
              return (
                <rect
                  key={annotation.id}
                  {...common}
                  x={left}
                  y={top}
                  width={width}
                  height={height}
                  fill="#000000"
                  stroke={selected ? "var(--selection)" : "#000000"}
                  strokeDasharray={selected ? "5 4" : undefined}
                  strokeWidth={selected ? 2 : 0}
                />
              );
            }
            return (
              <rect
                key={annotation.id}
                {...common}
                x={left}
                y={top}
                width={width}
                height={height}
                fill="none"
                stroke={annotation.color}
                strokeWidth={2}
              />
            );
          }
          if (annotation.type === "underline" || annotation.type === "strikeout") {
            const [x, y] = toViewportPoint({
              x: annotation.x,
              y: annotation.y + (annotation.type === "underline" ? 0.008 : annotation.height * 0.45),
            });
            const [x2] = toViewportPoint({ x: annotation.x + annotation.width, y: annotation.y });
            return (
              <line
                key={annotation.id}
                {...common}
                x1={x}
                y1={y}
                x2={x2}
                y2={y}
                stroke={annotation.color}
                strokeWidth={2}
              />
            );
          }
          if (annotation.type === "pen") {
            const points = annotation.points.map((point) => toViewportPoint(point).join(",")).join(" ");
            return (
              <polyline
                key={annotation.id}
                {...common}
                points={points}
                fill="none"
                stroke={annotation.color}
                strokeWidth={Math.max(1, annotation.strokeWidth * scale)}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={annotation.opacity}
              />
            );
          }
          if (annotation.type === "arrow") {
            const [x1, y1] = toViewportPoint({ x: annotation.x1, y: annotation.y1 });
            const [x2, y2] = toViewportPoint({ x: annotation.x2, y: annotation.y2 });
            const angle = Math.atan2(y2 - y1, x2 - x1);
            const size = Math.max(8, annotation.strokeWidth * 4 * scale);
            const p1 = [x2 - size * Math.cos(angle - Math.PI / 7), y2 - size * Math.sin(angle - Math.PI / 7)];
            const p2 = [x2 - size * Math.cos(angle + Math.PI / 7), y2 - size * Math.sin(angle + Math.PI / 7)];
            return (
              <g key={annotation.id} {...common}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={annotation.color}
                  strokeWidth={Math.max(1, annotation.strokeWidth * scale)}
                  opacity={annotation.opacity}
                />
                <polygon
                  points={`${x2},${y2} ${p1.join(",")} ${p2.join(",")}`}
                  fill={annotation.color}
                  opacity={annotation.opacity}
                />
              </g>
            );
          }
          if (annotation.type === "text" || annotation.type === "note") {
            const [x, y] = toViewportPoint({ x: annotation.x, y: annotation.y + annotation.height });
            const [x2, y2] = toViewportPoint({ x: annotation.x + annotation.width, y: annotation.y });
            const left = Math.min(x, x2);
            const top = Math.min(y, y2);
            const width = Math.abs(x2 - x);
            const height = Math.abs(y2 - y);
            const lines = annotation.text.split("\n");
            return (
              <g key={annotation.id} {...common}>
                {annotation.type === "note" ? (
                  <rect
                    x={left}
                    y={top}
                    width={width}
                    height={height}
                    fill="#fff7cc"
                    stroke="#d4a70b"
                    strokeWidth={1}
                    opacity={0.96}
                  />
                ) : (
                  <rect
                    x={left}
                    y={top}
                    width={width}
                    height={height}
                    fill={selected ? "rgba(56,189,248,0.10)" : "transparent"}
                    stroke={selected ? "var(--selection)" : "transparent"}
                    strokeDasharray="4 4"
                  />
                )}
                {annotation.type === "note" && (
                  <text x={left + 4} y={top + 12} fontSize={10} fill="#9a6700" fontWeight={700}>
                    N
                  </text>
                )}
                {lines.map((line, index) => (
                  <text
                    key={`${annotation.id}-${index}`}
                    x={left + (annotation.type === "note" ? 4 : 0)}
                    y={top + (annotation.type === "note" ? 24 : 0) + (annotation.fontSize * scale) * (index + 0.9)}
                    fontSize={annotation.fontSize * scale}
                    fill={annotation.type === "note" ? "#4b3b00" : annotation.color}
                    opacity={annotation.opacity}
                    fontFamily="Helvetica, Arial, sans-serif"
                  >
                    {line || " "}
                  </text>
                ))}
              </g>
            );
          }
          if (annotation.type === "image" || annotation.type === "signature") {
            const [x, y] = toViewportPoint({ x: annotation.x, y: annotation.y + annotation.height });
            const [x2, y2] = toViewportPoint({ x: annotation.x + annotation.width, y: annotation.y });
            return (
              <image
                key={annotation.id}
                {...common}
                href={annotation.dataUrl}
                x={Math.min(x, x2)}
                y={Math.min(y, y2)}
                width={Math.abs(x2 - x)}
                height={Math.abs(y2 - y)}
                opacity={annotation.opacity}
                style={{ ...common.style }}
              />
            );
          }
          return null;
        })}

        {pageAnnotations
          .filter((annotation) => annotation.id === selectedId && annotation.type !== "redact")
          .map((annotation) => {
            const bounds = annotationBounds(annotation);
            const [x, y] = toViewportPoint({ x: bounds.x, y: bounds.y + bounds.height });
            const [x2, y2] = toViewportPoint({ x: bounds.x + bounds.width, y: bounds.y });
            return (
              <rect
                key={`selection-${annotation.id}`}
                x={Math.min(x, x2) - 3}
                y={Math.min(y, y2) - 3}
                width={Math.abs(x2 - x) + 6}
                height={Math.abs(y2 - y) + 6}
                fill="none"
                stroke="var(--selection)"
                strokeDasharray="5 3"
                strokeWidth={1.5}
                pointerEvents="none"
              />
            );
          })}
      </svg>
      {loading && <div className="page-loading"><span className="spinner" /> {t("Renderizando…")}</div>}
    </div>
  );
};
