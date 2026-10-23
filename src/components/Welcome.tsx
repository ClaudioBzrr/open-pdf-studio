import { useRef, useState } from "react";
import { useI18n } from "../i18n";
import type { SidebarTab } from "./Sidebar";
import {
  ArrowRight,
  ArrowUpRight,
  Eye,
  FilePlus2,
  FileStack,
  GitCompare,
  LockKeyhole,
  PenLine,
  ScanText,
  ShieldCheck,
  Sparkles,
  TextCursorInput,
  UploadCloud,
  Wand2,
} from "lucide-react";

interface Props {
  onOpenFiles: (files: File[]) => void;
  onOpenSample: () => void;
  onOpenBlank: () => void;
  onChooseTool: (tool: SidebarTab) => void;
}

const tools: Array<{ id: SidebarTab; icon: typeof Eye; title: string; text: string }> = [
  {
    id: "view",
    icon: Eye,
    title: "Visualizar",
    text: "Leia com zoom, miniaturas, sumário, busca e leitura em voz alta.",
  },
  {
    id: "annotate",
    icon: PenLine,
    title: "Anotar",
    text: "Marca-texto, comentários, desenho, formas, texto, imagens e assinatura.",
  },
  {
    id: "pages",
    icon: FileStack,
    title: "Páginas",
    text: "Reordene, exclua, duplique, extraia, divida, mescle e gire páginas.",
  },
  {
    id: "forms",
    icon: TextCursorInput,
    title: "Formulários",
    text: "Preencha campos AcroForm e exporte os dados do formulário.",
  },
  {
    id: "edit",
    icon: Wand2,
    title: "Editar",
    text: "Aplique redação irreversível, cubra conteúdo, insira imagens e comprima.",
  },
  {
    id: "protect",
    icon: LockKeyhole,
    title: "Proteger",
    text: "Proteja com AES-256 e defina permissões de impressão, cópia e edição.",
  },
  {
    id: "ocr",
    icon: ScanText,
    title: "OCR",
    text: "Reconheça texto em português e inglês com Tesseract.js, localmente.",
  },
  {
    id: "compare",
    icon: GitCompare,
    title: "Comparar",
    text: "Compare duas versões lado a lado com destaque visual das diferenças.",
  },
];

export const Welcome = ({ onOpenFiles, onOpenSample, onOpenBlank, onChooseTool }: Props) => {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const pdfs = Array.from(files).filter((file) => /\.pdf$/i.test(file.name) || file.type === "application/pdf");
    if (pdfs.length > 0) onOpenFiles(pdfs);
  };

  return (
    <main
      className={`welcome toolkit-welcome ${dragging ? "is-dragging" : ""}`}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(event) => {
        if (event.currentTarget === event.target) setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        handleFiles(event.dataTransfer.files);
      }}
    >
      <div className="welcome-glow" aria-hidden="true" />

      <section className="toolkit-hero">
        <span className="eyebrow">
          <Sparkles size={14} /> {t("Ferramentas locais · Open source")}
        </span>
        <h1>
          {t("Suas ferramentas de PDF.")}
          <br />
          <span>{t("Seus arquivos ficam aqui.")}</span>
        </h1>
        <p className="hero-copy">
          {t(
            "Escolha uma ferramenta. O OpenPDF Studio abre o seletor de arquivo e leva você direto ao painel certo — sem upload, sem conta, sem servidor.",
          )}
        </p>

        <div className="tool-grid" aria-label={t("Ferramentas")}>
          {tools.map((tool) => (
            <button
              key={tool.id}
              type="button"
              className="tool-card"
              onClick={() => onChooseTool(tool.id)}
            >
              <span className="tool-card-icon" aria-hidden="true">
                <tool.icon size={20} />
              </span>
              <span className="tool-card-body">
                <strong>{t(tool.title)}</strong>
                <span>{t(tool.text)}</span>
              </span>
              <span className="tool-card-cta" aria-hidden="true">
                <ArrowUpRight size={15} />
              </span>
            </button>
          ))}
        </div>

        <div className="quick-open">
          <div className="quick-open-copy">
            <span className="quick-open-icon" aria-hidden="true">
              <UploadCloud size={21} />
            </span>
            <div>
              <strong>{t("Já tem um PDF?")}</strong>
              <span>{t("Arraste e solte em qualquer lugar ou abra pelo botão.")}</span>
            </div>
          </div>
          <div className="quick-open-actions">
            <button type="button" className="button primary" onClick={() => inputRef.current?.click()}>
              <UploadCloud size={16} /> {t("Abrir PDF")}
            </button>
            <button type="button" className="button ghost" onClick={onOpenSample}>
              <Eye size={16} /> {t("PDF de exemplo")}
            </button>
            <button type="button" className="button ghost" onClick={onOpenBlank}>
              <FilePlus2 size={16} /> {t("PDF em branco")}
            </button>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            multiple
            hidden
            onChange={(event) => {
              handleFiles(event.target.files);
              event.target.value = "";
            }}
          />
        </div>

        <div className="privacy-strip">
          <ShieldCheck size={16} />
          <span>
            <strong>{t("Sem upload.")}</strong>{" "}
            {t("Sem conta. Sem telemetria. Cada ferramenta roda no seu dispositivo.")}
          </span>
        </div>
      </section>

      <section className="welcome-note">
        <div>
          <span className="eyebrow">{t("Independência")}</span>
          <h2>{t("Inspirado na superfície de recursos do Acrobat, não no seu código.")}</h2>
        </div>
        <p>
          {t(
            "Este é um projeto independente, construído com bibliotecas open-source. Não é afiliado à Adobe e não contorna licenças, DRM ou recursos pagos. Recursos equivalentes são implementados com PDF.js, pdf-lib, Tesseract.js e APIs do navegador.",
          )}
        </p>
        <a className="welcome-source" href="https://github.com/ClaudioBzrr/open-pdf-studio" rel="noopener">
          {t("Ver o código no GitHub")} <ArrowRight size={14} />
        </a>
      </section>

      {dragging && (
        <div className="welcome-drop-overlay" aria-hidden="true">
          <UploadCloud size={30} />
          <strong>{t("Solte o PDF para abrir")}</strong>
          <span>{t("Processado no seu dispositivo")}</span>
        </div>
      )}
    </main>
  );
};
