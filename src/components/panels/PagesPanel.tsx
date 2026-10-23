import { useRef, useState } from "react";
import {
  CheckSquare,
  Copy,
  Download,
  GripVertical,
  Merge,
  RotateCcw,
  RotateCw,
  Scissors,
  Square,
  Trash2,
} from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { Thumbnail } from "../Thumbnail";
import { Button, Field, Section } from "../ui";
import { useI18n } from "../../i18n";

interface Props {
  pdf: PDFDocumentProxy;
  numPages: number;
  currentPage: number;
  rotation: number;
  selectedPages: Set<number>;
  onTogglePage: (page: number) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onPageChange: (page: number) => void;
  onMovePage: (from: number, to: number) => void;
  onRotate: (delta: number) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onExtract: () => void;
  onMergeFiles: (files: File[]) => void;
  onSplit: (afterPage: number) => void;
}

export const PagesPanel = ({
  pdf,
  numPages,
  currentPage,
  rotation,
  selectedPages,
  onTogglePage,
  onSelectAll,
  onClearSelection,
  onPageChange,
  onMovePage,
  onRotate,
  onDuplicate,
  onDelete,
  onExtract,
  onMergeFiles,
  onSplit,
}: Props) => {
  const { t } = useI18n();
  const mergeInput = useRef<HTMLInputElement>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [splitPage, setSplitPage] = useState(currentPage);
  const selectedCount = selectedPages.size;

  return (
    <div className="panel-content">
      <div className="panel-heading">
        <span className="eyebrow">{t("Organização")}</span>
        <h2>{t("Páginas")}</h2>
        <p className="muted small">{t("Arraste para reordenar. Marque páginas para ações em lote.")}</p>
      </div>

      <Section
        title={t("Seleção ({n})", { n: selectedCount || t("nenhuma") })}
        action={
          <button type="button" className="icon-button" onClick={selectedCount === numPages ? onClearSelection : onSelectAll} title={t("Selecionar todas")}>
            <CheckSquare size={15} />
          </button>
        }
      >
        <div className="button-row">
          <Button variant="secondary" className="small" onClick={onRotate.bind(null, -90)}><RotateCcw size={14} /> {t("Girar")}</Button>
          <Button variant="secondary" className="small" onClick={onRotate.bind(null, 90)}><RotateCw size={14} /> {t("Girar")}</Button>
        </div>
        <div className="button-row">
          <Button variant="secondary" className="small" onClick={onDuplicate}><Copy size={14} /> {t("Duplicar")}</Button>
          <Button variant="danger" className="small" onClick={onDelete}><Trash2 size={14} /> {t("Excluir")}</Button>
        </div>
        <div className="button-row">
          <Button variant="secondary" className="small" onClick={onExtract}><Download size={14} /> {t("Extrair")}</Button>
          <Button variant="secondary" className="small" onClick={() => mergeInput.current?.click()}><Merge size={14} /> {t("Mesclar")}</Button>
          <input
            ref={mergeInput}
            type="file"
            accept="application/pdf,.pdf"
            multiple
            hidden
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              if (files.length > 0) onMergeFiles(files);
              event.target.value = "";
            }}
          />
        </div>
      </Section>

      <Section title={t("Dividir documento")}>
        <Field label={t("Dividir após a página")}>
          <input
            type="number"
            min={1}
            max={Math.max(1, numPages - 1)}
            value={splitPage}
            onChange={(event) => setSplitPage(Number(event.target.value))}
          />
        </Field>
        <Button variant="secondary" className="small" onClick={() => onSplit(splitPage)}><Scissors size={14} /> {t("Dividir em dois PDFs")}</Button>
      </Section>

      <Section title={t("Ordem das páginas")}>
        <ul className="page-list">
          {Array.from({ length: numPages }, (_, index) => {
            const pageNumber = index + 1;
            const selected = selectedPages.has(pageNumber);
            return (
              <li
                key={pageNumber}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (dragIndex !== null && dragIndex !== index) onMovePage(dragIndex, index);
                  setDragIndex(null);
                }}
                onDragEnd={() => setDragIndex(null)}
                className={`page-list-item ${selected ? "is-selected" : ""} ${currentPage === pageNumber ? "is-current" : ""}`}
              >
                <span className="drag-handle" title={t("Arraste para reordenar")}><GripVertical size={15} /></span>
                <button type="button" className="page-check" onClick={() => onTogglePage(pageNumber)} title={t("Selecionar página")}>
                  {selected ? <CheckSquare size={16} /> : <Square size={16} />}
                </button>
                <Thumbnail
                  pdf={pdf}
                  pageNumber={pageNumber}
                  rotation={pageNumber === currentPage ? rotation : 0}
                  active={pageNumber === currentPage}
                  onClick={() => onPageChange(pageNumber)}
                />
                <span className="page-number">{t("Página {n}", { n: pageNumber })}</span>
              </li>
            );
          })}
        </ul>
      </Section>
    </div>
  );
};
