import { useState } from "react";
import { Copy, Download, FileDown, ScanText, Volume2 } from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import {
  createSearchablePdf,
  recognizePages,
  type OcrLanguage,
  type OcrResult,
} from "../../lib/ocr";
import { downloadBytes, downloadText, pdfFileName } from "../../lib/utils";
import { Button, Field, ProgressBar, Section } from "../ui";
import { useI18n } from "../../i18n";

interface Props {
  pdf: PDFDocumentProxy;
  bytes: Uint8Array;
  password?: string;
  currentPage: number;
  numPages: number;
  fileName: string;
  onNotify: (message: string, type?: "info" | "error" | "success") => void;
}

export const OcrPanel = ({ pdf, bytes, password, currentPage, numPages, fileName, onNotify }: Props) => {
  const { t } = useI18n();
  const [language, setLanguage] = useState<OcrLanguage>("por");
  const [scope, setScope] = useState<"current" | "all">("current");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ message: string; value: number } | null>(null);
  const [text, setText] = useState("");
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);

  const run = async () => {
    setBusy(true);
    setText("");
    setOcrResult(null);
    setProgress({ message: t("Inicializando OCR…"), value: 0.02 });
    try {
      const pages = scope === "current"
        ? [currentPage]
        : Array.from({ length: numPages }, (_, index) => index + 1);
      const result = await recognizePages(pdf, pages, language, (message, value) => {
        setProgress({ message, value: value ?? 0.1 });
      });
      setText(result.text);
      setOcrResult(result);
      onNotify(t("OCR concluído. O texto está disponível abaixo."), "success");
    } catch (error) {
      console.error(error);
      onNotify(
        t("Falha no OCR. Verifique se os arquivos de idioma estão em /tessdata e recarregue a página."),
        "error",
      );
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    onNotify(t("Texto copiado."), "success");
  };

  const makeSearchable = async () => {
    if (!ocrResult) return;
    setBusy(true);
    try {
      const result = await createSearchablePdf(bytes, pdf, ocrResult, password);
      downloadBytes(result, pdfFileName(fileName, "pesquisavel"));
      onNotify(t("PDF pesquisável gerado com camada de texto invisível."), "success");
    } catch (error) {
      console.error(error);
      onNotify(String((error as Error).message ?? error), "error");
    } finally {
      setBusy(false);
    }
  };

  const speak = () => {
    if (!text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.slice(0, 12_000));
    utterance.lang = language === "eng" ? "en-US" : "pt-BR";
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="panel-content">
      <div className="panel-heading">
        <span className="eyebrow">{t("Reconhecimento")}</span>
        <h2>{t("OCR")}</h2>
        <p className="muted small">{t("Texto de PDFs escaneados, processado no navegador.")}</p>
      </div>

      <div className="callout">
        <ScanText size={18} />
        <div>
          <strong>{t("Tesseract.js local.")}</strong>
          <p>{t("Os modelos de português e inglês estão incluídos no app. Nenhuma página é enviada para a nuvem.")}</p>
        </div>
      </div>

      <Section title={t("Configuração")}>
        <Field label={t("Idioma")}>
          <select value={language} onChange={(event) => setLanguage(event.target.value as OcrLanguage)}>
            <option value="por">{t("Português")}</option>
            <option value="eng">{t("Inglês")}</option>
            <option value="eng+por">{t("Português + inglês")}</option>
          </select>
        </Field>
        <Field label={t("Páginas")}>
          <select value={scope} onChange={(event) => setScope(event.target.value as "current" | "all")}>
            <option value="current">{t("Página atual ({n})", { n: currentPage })}</option>
            <option value="all">{t("Todas as {n} páginas", { n: numPages })}</option>
          </select>
        </Field>
        <Button variant="primary" onClick={run} disabled={busy}>
          <ScanText size={16} /> {busy ? t("Reconhecendo…") : t("Executar OCR")}
        </Button>
        {progress && <ProgressBar value={progress.value} label={progress.message} />}
      </Section>

      {text && (
        <Section
          title={t("Texto reconhecido")}
          action={
            <div className="inline-actions">
              <button type="button" className="icon-button" onClick={copy} title={t("Copiar")}><Copy size={15} /></button>
              <button type="button" className="icon-button" onClick={() => downloadText(text, pdfFileName(fileName, "ocr").replace(/\.pdf$/, ".txt"))} title={t("Baixar .txt")}><Download size={15} /></button>
              <button type="button" className="icon-button" onClick={speak} title={t("Ler em voz alta")}><Volume2 size={15} /></button>
            </div>
          }
        >
          <textarea className="ocr-output" rows={14} value={text} onChange={(event) => setText(event.target.value)} />
          <Button variant="secondary" className="small" onClick={makeSearchable} disabled={busy || !ocrResult}>
            <FileDown size={15} /> {t("Baixar PDF pesquisável")}
          </Button>
          <p className="panel-footnote">
            {t("O PDF pesquisável mantém a imagem original e adiciona uma camada de texto invisível, permitindo busca e seleção. A precisão depende do OCR.")}
          </p>
        </Section>
      )}

      <p className="panel-footnote">
        {t("Dica: para PDFs digitalizados, use 200–300 DPI no momento da digitalização. O OCR pode falhar em manuscritos e layouts complexos.")}
      </p>
    </div>
  );
};
