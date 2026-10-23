import { useRef, useState } from "react";
import { useI18n } from "../i18n";
import {
  ArrowRight,
  Eye,
  FilePlus2,
  FileStack,
  LockKeyhole,
  PenLine,
  ScanText,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  WifiOff,
} from "lucide-react";

interface Props {
  onOpenFiles: (files: File[]) => void;
  onOpenSample: () => void;
  onOpenBlank: () => void;
}

const features = [
  {
    icon: Eye,
    title: "Leitor completo",
    text: "Renderização nítida, zoom, rotação, miniaturas, sumário, busca e leitura em voz alta.",
  },
  {
    icon: PenLine,
    title: "Anotar e editar",
    text: "Marca-texto, comentários, desenho, formas, texto, imagens, assinatura visual e cobertura.",
  },
  {
    icon: FileStack,
    title: "Organizar páginas",
    text: "Reordenar, excluir, duplicar, extrair, dividir, mesclar e girar páginas.",
  },
  {
    icon: ScanText,
    title: "OCR local",
    text: "Reconhecimento de texto em português e inglês com Tesseract.js, sem enviar o PDF.",
  },
  {
    icon: LockKeyhole,
    title: "Proteção AES-256",
    text: "Senhas e permissões de impressão, cópia e edição aplicadas no próprio navegador.",
  },
  {
    icon: WifiOff,
    title: "Privacidade por arquitetura",
    text: "Não existe servidor de documentos. O arquivo nunca sai do seu dispositivo.",
  },
];

export const Welcome = ({ onOpenFiles, onOpenSample, onOpenBlank }: Props) => {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const pdfs = Array.from(files).filter((file) => /\.pdf$/i.test(file.name) || file.type === "application/pdf");
    if (pdfs.length > 0) onOpenFiles(pdfs);
  };

  return (
    <main className="welcome">
      <div className="welcome-glow" aria-hidden="true" />
      <section className="hero">
        <span className="eyebrow"><Sparkles size={14} /> {t("Workspace de PDF open-source")}</span>
        <h1>{t("Seus PDFs.")}<br /><span>{t("No seu navegador.")}</span></h1>
        <p className="hero-copy">
          {t("Leia, edite, assine, proteja, oculte e reconheça texto em PDFs sem criar conta e sem enviar arquivos para nenhum servidor. A privacidade não é uma opção: é a arquitetura.")}
        </p>

        <div
          className={`dropzone ${dragging ? "is-dragging" : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            handleFiles(event.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
          }}
        >
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
          <span className="dropzone-icon"><UploadCloud size={28} /></span>
          <strong>{t("Arraste um PDF aqui ou clique para abrir")}</strong>
          <span className="muted">{t("Processado no seu dispositivo · até vários arquivos para mesclar")}</span>
          <span className="button primary"><ArrowRight size={16} /> {t("Escolher PDF")}</span>
        </div>

        <div className="hero-actions">
          <button type="button" className="button ghost" onClick={onOpenSample}>
            <Eye size={16} /> {t("Abrir PDF de exemplo")}
          </button>
          <button type="button" className="button ghost" onClick={onOpenBlank}>
            <FilePlus2 size={16} /> {t("Criar PDF em branco")}
          </button>
        </div>

        <div className="privacy-strip">
          <ShieldCheck size={16} />
          <span>
            <strong>{t("Sem upload.")}</strong> {t("Sem conta. Sem telemetria. O código roda inteiramente no cliente.")}
          </span>
        </div>
      </section>

      <section className="feature-grid" aria-label={t("Recursos")}>
        {features.map((feature) => (
          <article className="feature-card" key={feature.title}>
            <span className="feature-icon"><feature.icon size={20} /></span>
            <h2>{t(feature.title)}</h2>
            <p>{t(feature.text)}</p>
          </article>
        ))}
      </section>

      <section className="welcome-note">
        <div>
          <span className="eyebrow">{t("Independência")}</span>
          <h2>{t("Inspirado na superfície de recursos do Acrobat, não no seu código.")}</h2>
        </div>
        <p>
          {t("Este é um projeto independente, construído com bibliotecas open-source. Não é afiliado à Adobe e não contorna licenças, DRM ou recursos pagos. Recursos equivalentes são implementados com PDF.js, pdf-lib, Tesseract.js e APIs do navegador.")}
        </p>
      </section>
    </main>
  );
};
