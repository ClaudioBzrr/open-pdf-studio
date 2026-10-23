import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { renderPage } from "../lib/pdf";

interface Props {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  rotation: number;
  active: boolean;
  onClick: () => void;
}

export const Thumbnail = ({ pdf, pageNumber, rotation, active, onClick }: Props) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = buttonRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "220px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    const draw = async () => {
      const page = await pdf.getPage(pageNumber);
      if (cancelled) return;
      const base = page.getViewport({ scale: 1, rotation: page.rotate + rotation });
      const scale = 132 / Math.max(1, base.width);
      const { canvas } = await renderPage(pdf, pageNumber, scale, rotation);
      if (cancelled) return;
      const target = canvasRef.current;
      if (!target) return;
      target.width = canvas.width;
      target.height = canvas.height;
      target.getContext("2d")?.drawImage(canvas, 0, 0);
    };
    draw().catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [visible, pdf, pageNumber, rotation]);

  return (
    <button
      ref={buttonRef}
      type="button"
      className={`thumbnail ${active ? "is-active" : ""}`}
      onClick={onClick}
      title={`Ir para a página ${pageNumber}`}
    >
      <span className="thumbnail-canvas-wrap">
        <canvas ref={canvasRef} />
        {!visible && <span className="thumbnail-skeleton" />}
      </span>
      <span className="thumbnail-label">{pageNumber}</span>
    </button>
  );
};
