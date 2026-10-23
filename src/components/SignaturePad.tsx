import { useEffect, useRef } from "react";
import { Eraser } from "lucide-react";
import { signaturePadDataUrl } from "../lib/signature";
import { useI18n } from "../i18n";

interface Props {
  color: string;
  onChange: (dataUrl: string) => void;
}

export const SignaturePad = ({ color, onChange }: Props) => {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 760;
    canvas.height = 240;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const pointFromEvent = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const start = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(event.pointerId);
    drawing.current = true;
    last.current = pointFromEvent(event);
  };

  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || !last.current) return;
    const point = pointFromEvent(event);
    context.strokeStyle = color;
    context.lineWidth = 4;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    context.moveTo(last.current.x, last.current.y);
    context.lineTo(point.x, point.y);
    context.stroke();
    last.current = point;
  };

  const end = (event: React.PointerEvent<HTMLCanvasElement>) => {
    drawing.current = false;
    last.current = null;
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    onChange(signaturePadDataUrl(canvas));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    onChange("");
  };

  return (
    <div className="signature-pad">
      <canvas
        ref={canvasRef}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        aria-label={t("Área para desenhar a assinatura")}
      />
      <button type="button" className="button ghost small" onClick={clear}>
        <Eraser size={14} /> {t("Limpar")}
      </button>
    </div>
  );
};
