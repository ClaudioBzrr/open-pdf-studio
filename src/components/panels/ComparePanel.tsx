import { useRef, useState } from "react";
import { FileUp, GitCompare, RefreshCw } from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { ComparePageResult } from "../../types";
import { comparePdfs } from "../../lib/compare";
import { loadPdfJs } from "../../lib/pdf";
import { formatBytes } from "../../lib/utils";
import { Button, ProgressBar, Section } from "../ui";
import { useI18n } from "../../i18n";

interface Props {
  pdf: PDFDocumentProxy;
  fileName: string;
  onNotify: (message: string, type?: "info" | "error" | "success") => void;
}

export const ComparePanel = ({ pdf, fileName, onNotify }: Props) => {
  const { t, lang } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [otherPdf, setOtherPdf] = useState<PDFDocumentProxy | null>(null);
  const [otherName, setOtherName] = useState("");
  const [otherSize, setOtherSize] = useState(0);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ message: string; value: number } | null>(null);
  const [results, setResults] = useState<ComparePageResult[]>([]);

  const openOther = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const loaded = await loadPdfJs(bytes);
      setOtherPdf(loaded);
      setOtherName(file.name);
      setOtherSize(bytes.byteLength);
      setResults([]);
    } catch (error) {
      onNotify(t("Não foi possível abrir o segundo PDF. Ele pode estar protegido por senha."), "error");
    } finally {
      setBusy(false);
    }
  };

  const compare = async () => {
    if (!otherPdf) return;
    setBusy(true);
    setResults([]);
    setProgress({ message: t("Preparando comparação…"), value: 0.01 });
    try {
      const compared = await comparePdfs(pdf, otherPdf, (message, value) => {
        setProgress({ message, value: value ?? 0.1 });
      });
      setResults(compared);
      onNotify(t("Comparação concluída."), "success");
    } catch (error) {
      console.error(error);
      onNotify(t("Falha ao comparar os documentos."), "error");
    } finally {
      setBusy(false);
    }
  };

  const average = results.length
    ? results.reduce((sum, result) => sum + result.similarity, 0) / results.length
    : 0;

  return (
    <div className="panel-content">
      <div className="panel-heading">
        <span className="eyebrow">{t("Revisão")}</span>
        <h2>{t("Comparar")}</h2>
        <p className="muted small">{t("Veja diferenças visuais entre duas versões, sem servidor.")}</p>
      </div>

      <Section title={t("Segundo documento")}>
        <div className="compare-source">
          <div>
            <strong>{t("Original")}</strong>
            <span className="muted small">{fileName} · {pdf.numPages} {t("páginas")}</span>
          </div>
          <div>
            <strong>{t("Comparar com")}</strong>
            <span className="muted small">{otherPdf ? `${otherName} · ${otherPdf.numPages} ${t("páginas")} · ${formatBytes(otherSize)}` : t("Nenhum arquivo selecionado")}</span>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          hidden
          onChange={(event) => {
            openOther(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <div className="button-row">
          <Button variant="secondary" onClick={() => inputRef.current?.click()} disabled={busy}>
            <FileUp size={16} /> {t("Escolher segundo PDF")}
          </Button>
          <Button variant="primary" onClick={compare} disabled={busy || !otherPdf}>
            <GitCompare size={16} /> {t("Comparar")}
          </Button>
        </div>
        {progress && <ProgressBar value={progress.value} label={progress.message} />}
        {busy && !progress && <p className="muted small"><RefreshCw size={14} className="spin" /> {t("Processando…")}</p>}
      </Section>

      {results.length > 0 && (
        <>
          <Section title={t("Resumo")}>
            <div className="compare-summary">
              <div><strong>{Math.round(average * 100)}%</strong><span>{t("similaridade média")}</span></div>
              <div><strong>{results.reduce((sum, result) => sum + result.differentPixels, 0).toLocaleString(lang === "pt" ? "pt-BR" : "en-US")}</strong><span>{t("pixels diferentes")}</span></div>
              <div><strong>{results.length}</strong><span>{t("páginas comparadas")}</span></div>
            </div>
            <p className="muted small">{t("Comparação visual de até 30 páginas. Pequenas diferenças de renderização podem gerar ruído.")}</p>
          </Section>

          <div className="compare-results">
            {results.map((result) => (
              <article className="compare-card" key={result.page}>
                <header>
                  <strong>{t("Página {n}", { n: result.page })}</strong>
                  <span className={`similarity ${result.similarity > 0.98 ? "good" : result.similarity > 0.9 ? "warn" : "bad"}`}>
                    {Math.round(result.similarity * 100)}% {t("similar")}
                  </span>
                </header>
                <div className="compare-images">
                  <figure>
                    <img src={result.beforeUrl} alt={`${t("Original")} ${result.page}`} loading="lazy" />
                    <figcaption>{t("Original")}</figcaption>
                  </figure>
                  <figure>
                    <img src={result.afterUrl} alt={`${t("Comparado")} ${result.page}`} loading="lazy" />
                    <figcaption>{t("Comparado")}</figcaption>
                  </figure>
                  <figure>
                    <img src={result.diffUrl} alt={`${t("Diferenças")} ${result.page}`} loading="lazy" />
                    <figcaption>{t("Diferenças")}</figcaption>
                  </figure>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
