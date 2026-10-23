import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  MoveHorizontal,
  RotateCcw,
  RotateCw,
  Search,
  Volume2,
  VolumeX,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { Annotation, ToolId } from "../types";
import { clamp } from "../lib/utils";
import { useI18n } from "../i18n";
import { PageCanvas } from "./PageCanvas";
import { SearchPanel } from "./SearchPanel";
import type { SearchHit } from "../lib/pdf";

export type FitMode = "none" | "width" | "page";

interface Props {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  numPages: number;
  zoom: number;
  fitMode: FitMode;
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
  searchOpen: boolean;
  searchQuery: string;
  searchHits: SearchHit[];
  searching: boolean;
  searchProgress: number;
  speaking: boolean;
  onPageChange: (page: number) => void;
  onZoomChange: (zoom: number) => void;
  onFitModeChange: (mode: FitMode) => void;
  onRotate: (delta: number) => void;
  onAddAnnotation: (annotation: Annotation) => void;
  onUpdateAnnotation: (id: string, patch: Partial<Annotation>) => void;
  onSelectAnnotation: (id: string | null) => void;
  onOpenSearch: () => void;
  onCloseSearch: () => void;
  onSearchQueryChange: (value: string) => void;
  onSearch: () => void;
  onSelectSearchHit: (hit: SearchHit) => void;
  onToggleReadAloud: () => void;
}

export const Viewer = ({
  pdf,
  pageNumber,
  numPages,
  zoom,
  fitMode,
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
  searchOpen,
  searchQuery,
  searchHits,
  searching,
  searchProgress,
  speaking,
  onPageChange,
  onZoomChange,
  onFitModeChange,
  onRotate,
  onAddAnnotation,
  onUpdateAnnotation,
  onSelectAnnotation,
  onOpenSearch,
  onCloseSearch,
  onSearchQueryChange,
  onSearch,
  onSelectSearchHit,
  onToggleReadAloud,
}: Props) => {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const pageScrollRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 900, height: 700 });
  const [baseSize, setBaseSize] = useState({ width: 612, height: 792 });
  const [pageInput, setPageInput] = useState(String(pageNumber));

  useEffect(() => {
    setPageInput(String(pageNumber));
    pageScrollRef.current?.scrollTo({ top: 0, left: 0 });
  }, [pageNumber]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setContainerSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    pdf.getPage(pageNumber).then((page) => {
      if (cancelled) return;
      const viewport = page.getViewport({ scale: 1, rotation: page.rotate + rotation });
      setBaseSize({ width: viewport.width, height: viewport.height });
    }).catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [pdf, pageNumber, rotation]);

  const effectiveScale = useMemo(() => {
    const availableWidth = Math.max(260, containerSize.width - 72);
    const availableHeight = Math.max(260, containerSize.height - 118);
    if (fitMode === "width") return clamp(availableWidth / baseSize.width, 0.15, 5);
    if (fitMode === "page") {
      return clamp(Math.min(availableWidth / baseSize.width, availableHeight / baseSize.height), 0.15, 5);
    }
    return clamp(zoom, 0.15, 5);
  }, [baseSize, containerSize, fitMode, zoom]);

  const goToPage = (page: number) => {
    onPageChange(clamp(page, 1, numPages));
  };

  const nudgeZoom = (factor: number) => {
    onFitModeChange("none");
    onZoomChange(clamp(effectiveScale * factor, 0.15, 5));
  };

  return (
    <section className="viewer" ref={containerRef}>
      <div className="viewer-toolbar">
        <div className="toolbar-group">
          <button
            type="button"
            className="icon-button"
            onClick={() => goToPage(pageNumber - 1)}
            disabled={pageNumber <= 1}
            aria-label={t("Página anterior")}
            title={`${t("Página anterior")} (←)`}
          >
            <ChevronLeft size={18} />
          </button>
          <form
            className="page-jump"
            onSubmit={(event) => {
              event.preventDefault();
              const parsed = Number.parseInt(pageInput, 10);
              if (Number.isFinite(parsed)) goToPage(parsed);
            }}
          >
            <input
              value={pageInput}
              onChange={(event) => setPageInput(event.target.value)}
              aria-label={t("Número da página")}
              inputMode="numeric"
            />
            <span>/ {numPages}</span>
          </form>
          <button
            type="button"
            className="icon-button"
            onClick={() => goToPage(pageNumber + 1)}
            disabled={pageNumber >= numPages}
            aria-label={t("Próxima página")}
            title={`${t("Próxima página")} (→)`}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="toolbar-separator" />

        <div className="toolbar-group">
          <button type="button" className="icon-button" onClick={() => nudgeZoom(1 / 1.15)} title={t("Diminuir zoom")}>
            <ZoomOut size={17} />
          </button>
          <button
            type="button"
            className="zoom-label"
            onClick={() => {
              onFitModeChange("none");
              onZoomChange(1);
            }}
            title={t("Redefinir para 100%")}
          >
            {Math.round(effectiveScale * 100)}%
          </button>
          <button type="button" className="icon-button" onClick={() => nudgeZoom(1.15)} title={t("Aumentar zoom")}>
            <ZoomIn size={17} />
          </button>
          <button
            type="button"
            className={`icon-button ${fitMode === "width" ? "is-active" : ""}`}
            onClick={() => onFitModeChange("width")}
            title={t("Ajustar à largura")}
          >
            <MoveHorizontal size={17} />
          </button>
          <button
            type="button"
            className={`icon-button ${fitMode === "page" ? "is-active" : ""}`}
            onClick={() => onFitModeChange("page")}
            title={t("Ajustar à página")}
          >
            <Maximize2 size={17} />
          </button>
        </div>

        <div className="toolbar-separator" />

        <div className="toolbar-group">
          <button type="button" className="icon-button" onClick={() => onRotate(-90)} title={t("Girar 90° à esquerda")}>
            <RotateCcw size={17} />
          </button>
          <button type="button" className="icon-button" onClick={() => onRotate(90)} title={t("Girar 90° à direita")}>
            <RotateCw size={17} />
          </button>
          <button
            type="button"
            className={`icon-button ${searchOpen ? "is-active" : ""}`}
            onClick={onOpenSearch}
            title={t("Buscar no documento (Ctrl+F)")}
          >
            <Search size={17} />
          </button>
          <button
            type="button"
            className={`icon-button ${speaking ? "is-active" : ""}`}
            onClick={onToggleReadAloud}
            title={speaking ? t("Parar leitura") : t("Ler esta página em voz alta")}
          >
            {speaking ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>
        </div>

        <div className="toolbar-spacer" />
        <span className={`tool-indicator ${tool !== "select" ? "is-active" : ""}`}>
          {tool === "select" ? t("Selecionar") : t(toolLabel(tool))}
        </span>
      </div>

      <div className="page-scroll" ref={pageScrollRef}>
        <PageCanvas
          pdf={pdf}
          pageNumber={pageNumber}
          scale={effectiveScale}
          rotation={rotation}
          annotations={annotations}
          tool={tool}
          color={color}
          strokeWidth={strokeWidth}
          opacity={opacity}
          fontSize={fontSize}
          selectedId={selectedId}
          searchBoxes={searchBoxes}
          pendingAsset={pendingAsset}
          onAdd={onAddAnnotation}
          onUpdate={onUpdateAnnotation}
          onSelect={onSelectAnnotation}
        />
      </div>

      {searchOpen && (
        <SearchPanel
          query={searchQuery}
          onQueryChange={onSearchQueryChange}
          hits={searchHits}
          searching={searching}
          progress={searchProgress}
          onSearch={onSearch}
          onClose={onCloseSearch}
          onSelect={onSelectSearchHit}
        />
      )}
    </section>
  );
};

const toolLabel = (tool: ToolId): string => {
  const labels: Record<ToolId, string> = {
    select: "Selecionar",
    highlight: "Marca-texto",
    underline: "Sublinhado",
    strikeout: "Tachado",
    note: "Comentário",
    pen: "Caneta",
    rect: "Retângulo",
    arrow: "Seta",
    text: "Texto",
    redact: "Redação",
    whiteout: "Cobertura",
    image: "Imagem",
    signature: "Assinatura",
  };
  return labels[tool];
};
