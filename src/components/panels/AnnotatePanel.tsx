import {
  ArrowUpRight,
  Download,
  FileJson,
  Highlighter,
  MousePointer2,
  PenTool,
  Redo2,
  Square,
  StickyNote,
  Strikethrough,
  Trash2,
  Type,
  Underline,
  Undo2,
} from "lucide-react";
import type { Annotation, ToolId } from "../../types";
import { annotationLabel, annotationSummary } from "../../lib/annotations";
import { Button, ColorSwatches, Field, Section } from "../ui";
import { useI18n } from "../../i18n";

const tools: Array<{ id: ToolId; label: string; icon: typeof MousePointer2 }> = [
  { id: "select", label: "Selecionar", icon: MousePointer2 },
  { id: "highlight", label: "Marca-texto", icon: Highlighter },
  { id: "underline", label: "Sublinhado", icon: Underline },
  { id: "strikeout", label: "Tachado", icon: Strikethrough },
  { id: "note", label: "Comentário", icon: StickyNote },
  { id: "pen", label: "Caneta", icon: PenTool },
  { id: "rect", label: "Retângulo", icon: Square },
  { id: "arrow", label: "Seta", icon: ArrowUpRight },
  { id: "text", label: "Texto", icon: Type },
];

const palette = ["#facc15", "#fb923c", "#f87171", "#f472b6", "#c084fc", "#60a5fa", "#34d399", "#111827", "#ffffff"];

interface Props {
  tool: ToolId;
  color: string;
  opacity: number;
  strokeWidth: number;
  fontSize: number;
  annotations: Annotation[];
  selected: Annotation | null;
  canUndo: boolean;
  canRedo: boolean;
  onToolChange: (tool: ToolId) => void;
  onColorChange: (color: string) => void;
  onOpacityChange: (value: number) => void;
  onStrokeWidthChange: (value: number) => void;
  onFontSizeChange: (value: number) => void;
  onSelect: (id: string | null) => void;
  onUpdate: (id: string, patch: Partial<Annotation>) => void;
  onDelete: (id: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onDownload: () => void;
  onExportJson: () => void;
}

export const AnnotatePanel = ({
  tool,
  color,
  opacity,
  strokeWidth,
  fontSize,
  annotations,
  selected,
  canUndo,
  canRedo,
  onToolChange,
  onColorChange,
  onOpacityChange,
  onStrokeWidthChange,
  onFontSizeChange,
  onSelect,
  onUpdate,
  onDelete,
  onUndo,
  onRedo,
  onClear,
  onDownload,
  onExportJson,
}: Props) => {
  const { t } = useI18n();
  const summarize = (annotation: Annotation): string => {
    const summary = annotationSummary(annotation);
    return summary === "Página {n}"
      ? t(summary, { n: annotation.pageIndex + 1 })
      : t(summary);
  };
  return (
  <div className="panel-content">
    <div className="panel-heading">
      <span className="eyebrow">{t("Marcações")}</span>
      <h2>{t("Anotar")}</h2>
      <p className="muted small">{t("Escolha uma ferramenta e arraste sobre a página.")}</p>
    </div>

    <Section title={t("Ferramentas")}>
      <div className="tool-grid">
        {tools.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`tool-button ${tool === item.id ? "is-active" : ""}`}
            onClick={() => onToolChange(item.id)}
          >
            <item.icon size={18} />
            <span>{t(item.label)}</span>
          </button>
        ))}
      </div>
    </Section>

    <Section title={t("Aparência")}>
      <Field label={t("Cor")}>
        <ColorSwatches value={color} onChange={onColorChange} colors={palette} />
      </Field>
      <Field label={t("Opacidade · {n}%", { n: Math.round(opacity * 100) })}>
        <input type="range" min={0.1} max={1} step={0.05} value={opacity} onChange={(event) => onOpacityChange(Number(event.target.value))} />
      </Field>
      {(tool === "pen" || tool === "arrow" || tool === "rect") && (
        <Field label={t("Espessura · {n} pt", { n: strokeWidth })}>
          <input type="range" min={1} max={12} step={0.5} value={strokeWidth} onChange={(event) => onStrokeWidthChange(Number(event.target.value))} />
        </Field>
      )}
      {(tool === "text" || tool === "note") && (
        <Field label={t("Tamanho do texto · {n} pt", { n: fontSize })}>
          <input type="range" min={7} max={36} step={1} value={fontSize} onChange={(event) => onFontSizeChange(Number(event.target.value))} />
        </Field>
      )}
    </Section>

    {selected && (
      <Section title={t("Selecionado")} action={<button type="button" className="icon-button danger" onClick={() => onDelete(selected.id)} title={t("Excluir")}><Trash2 size={15} /></button>}>
        <p className="annotation-title">{t(annotationLabel(selected))}</p>
        {(selected.type === "text" || selected.type === "note") && (
          <Field label={t("Conteúdo")}>
            <textarea
              rows={4}
              value={selected.text}
              onChange={(event) => onUpdate(selected.id, { text: event.target.value } as Partial<Annotation>)}
            />
          </Field>
        )}
        <div className="inline-fields">
          <Field label={t("Cor")}>
            <input type="color" value={selected.color} onChange={(event) => onUpdate(selected.id, { color: event.target.value } as Partial<Annotation>)} />
          </Field>
          <Field label={t("Opacidade · {n}%", { n: Math.round(selected.opacity * 100) })}>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={selected.opacity}
              onChange={(event) => onUpdate(selected.id, { opacity: Number(event.target.value) } as Partial<Annotation>)}
            />
          </Field>
        </div>
      </Section>
    )}

    <Section
      title={t("Anotações ({n})", { n: annotations.length })}
      action={
        <div className="inline-actions">
          <button type="button" className="icon-button" onClick={onUndo} disabled={!canUndo} title={t("Desfazer")}><Undo2 size={15} /></button>
          <button type="button" className="icon-button" onClick={onRedo} disabled={!canRedo} title={t("Refazer")}><Redo2 size={15} /></button>
        </div>
      }
    >
      {annotations.length === 0 ? (
        <p className="muted small">{t("Nenhuma anotação ainda.")}</p>
      ) : (
        <ul className="annotation-list">
          {[...annotations].reverse().slice(0, 40).map((annotation) => (
            <li key={annotation.id} className={selected?.id === annotation.id ? "is-active" : ""}>
              <button type="button" onClick={() => onSelect(annotation.id)}>
                <span className="annotation-dot" style={{ background: annotation.color }} />
                <span>
                  <strong>{t(annotationLabel(annotation))}</strong>
                  <span className="annotation-sub">{summarize(annotation)}</span>
                </span>
              </button>
              <button type="button" className="icon-button danger" onClick={() => onDelete(annotation.id)} title={t("Excluir")}>
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {annotations.length > 0 && (
        <Button variant="ghost" className="small" onClick={onClear}>{t("Limpar todas")}</Button>
      )}
    </Section>

    <div className="panel-actions">
      <Button variant="primary" onClick={onDownload}><Download size={16} /> {t("Baixar PDF com anotações")}</Button>
      <Button variant="secondary" onClick={onExportJson}><FileJson size={16} /> {t("Exportar JSON")}</Button>
    </div>
    <p className="panel-footnote">{t("As anotações são achatadas no PDF exportado. O arquivo original não é modificado.")}</p>
  </div>
  );
};
