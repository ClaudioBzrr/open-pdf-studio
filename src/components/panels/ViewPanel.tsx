import { ChevronRight, FileText, ListTree, RotateCw } from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { OutlineNode, PdfMetadata } from "../../types";
import { Thumbnail } from "../Thumbnail";
import { Section } from "../ui";
import { useI18n } from "../../i18n";

interface Props {
  pdf: PDFDocumentProxy;
  numPages: number;
  currentPage: number;
  rotation: number;
  outline: OutlineNode[];
  metadata: PdfMetadata;
  onPageChange: (page: number) => void;
  onRotatePage: () => void;
}

const OutlineList = ({
  nodes,
  depth = 0,
  onPageChange,
}: {
  nodes: OutlineNode[];
  depth?: number;
  onPageChange: (page: number) => void;
}) => (
  <ul className="outline-list" style={{ paddingLeft: depth === 0 ? 0 : 14 }}>
    {nodes.map((node, index) => (
      <li key={`${node.title}-${index}`}>
        <button
          type="button"
          className="outline-item"
          disabled={node.pageIndex === null}
          onClick={() => {
            if (node.pageIndex !== null) onPageChange(node.pageIndex + 1);
          }}
        >
          <ChevronRight size={13} />
          <span>{node.title}</span>
        </button>
        {node.children.length > 0 && (
          <OutlineList nodes={node.children} depth={depth + 1} onPageChange={onPageChange} />
        )}
      </li>
    ))}
  </ul>
);

export const ViewPanel = ({
  pdf,
  numPages,
  currentPage,
  rotation,
  outline,
  metadata,
  onPageChange,
  onRotatePage,
}: Props) => {
  const { t } = useI18n();
  return (
  <div className="panel-content">
    <div className="panel-heading">
      <span className="eyebrow">{t("Documento")}</span>
      <h2>{t("Visualizar")}</h2>
      <p className="muted small">{t("Navegue por miniaturas, sumário e propriedades.")}</p>
    </div>

    <Section
      title={t("Páginas ({n})", { n: numPages })}
      action={
        <button type="button" className="icon-button" onClick={onRotatePage} title={t("Girar página atual")}>
          <RotateCw size={15} />
        </button>
      }
    >
      <div className="thumbnail-grid">
        {Array.from({ length: numPages }, (_, index) => (
          <Thumbnail
            key={index + 1}
            pdf={pdf}
            pageNumber={index + 1}
            rotation={index + 1 === currentPage ? rotation : 0}
            active={index + 1 === currentPage}
            onClick={() => onPageChange(index + 1)}
          />
        ))}
      </div>
    </Section>

    <Section title={t("Sumário")}>
      {outline.length === 0 ? (
        <div className="empty-inline">
          <ListTree size={18} />
          <span>{t("Este PDF não possui marcadores.")}</span>
        </div>
      ) : (
        <OutlineList nodes={outline} onPageChange={onPageChange} />
      )}
    </Section>

    <Section title={t("Propriedades")}>
      <dl className="metadata-list">
        {metadata.title && (<><dt>{t("Título")}</dt><dd>{metadata.title}</dd></>)}
        {metadata.author && (<><dt>{t("Autor")}</dt><dd>{metadata.author}</dd></>)}
        {metadata.subject && (<><dt>{t("Assunto")}</dt><dd>{metadata.subject}</dd></>)}
        {metadata.keywords && (<><dt>{t("Palavras-chave")}</dt><dd>{metadata.keywords}</dd></>)}
        {metadata.creator && (<><dt>{t("Criador")}</dt><dd>{metadata.creator}</dd></>)}
        {metadata.producer && (<><dt>{t("Produtor")}</dt><dd>{metadata.producer}</dd></>)}
        {metadata.creationDate && (<><dt>{t("Criado em")}</dt><dd>{metadata.creationDate}</dd></>)}
        {!Object.values(metadata).some(Boolean) && (
          <><dt>{t("Metadados")}</dt><dd>{t("Não informados")}</dd></>
        )}
      </dl>
    </Section>

    <Section title={t("Atalhos")}>
      <ul className="shortcut-list">
        <li><kbd>←</kbd><kbd>→</kbd><span>{t("Navegar entre páginas")}</span></li>
        <li><kbd>Ctrl</kbd>+<kbd>O</kbd><span>{t("Abrir PDF")}</span></li>
        <li><kbd>Ctrl</kbd>+<kbd>S</kbd><span>{t("Baixar PDF editado")}</span></li>
        <li><kbd>Ctrl</kbd>+<kbd>Z</kbd><span>{t("Desfazer anotação")}</span></li>
        <li><kbd>Del</kbd><span>{t("Excluir anotação selecionada")}</span></li>
      </ul>
    </Section>

    <div className="panel-footnote">
      <FileText size={15} />
      <span>{t("Renderização por PDF.js. O arquivo é lido diretamente da memória do navegador.")}</span>
    </div>
  </div>
  );
};
