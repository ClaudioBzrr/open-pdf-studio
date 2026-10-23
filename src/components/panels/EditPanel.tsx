import { useRef, useState } from "react";
import {
  FileImage,
  PenLine,
  ScanLine,
  ShieldAlert,
  SlidersHorizontal,
  Type,
  Wand2,
} from "lucide-react";
import type { ToolId } from "../../types";
import { typedSignatureDataUrl } from "../../lib/signature";
import { SignaturePad } from "../SignaturePad";
import { Button, ColorSwatches, Field, ProgressBar, Section, Toggle } from "../ui";
import { useI18n } from "../../i18n";

interface Props {
  tool: ToolId;
  color: string;
  opacity: number;
  fontSize: number;
  pendingAsset: string | null;
  redactionCount: number;
  busy: boolean;
  progress: { message: string; value?: number } | null;
  onToolChange: (tool: ToolId) => void;
  onColorChange: (color: string) => void;
  onOpacityChange: (value: number) => void;
  onFontSizeChange: (value: number) => void;
  onPendingAsset: (asset: string | null) => void;
  onClearRedactions: () => void;
  onApplyRedactions: (options: { dpi: number; stripMetadata: boolean }) => void;
  onCompress: (options: { dpi: number; quality: number }) => void;
}

type Tab = "content" | "redact" | "compress";

const palette = ["#111827", "#1d4ed8", "#dc2626", "#16a34a", "#f59e0b", "#ffffff"];

export const EditPanel = ({
  tool,
  color,
  opacity,
  fontSize,
  pendingAsset,
  redactionCount,
  busy,
  progress,
  onToolChange,
  onColorChange,
  onOpacityChange,
  onFontSizeChange,
  onPendingAsset,
  onClearRedactions,
  onApplyRedactions,
  onCompress,
}: Props) => {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>("content");
  const [signatureMode, setSignatureMode] = useState<"draw" | "type">("draw");
  const [signatureText, setSignatureText] = useState("");
  const [drawnSignature, setDrawnSignature] = useState("");
  const [redactDpi, setRedactDpi] = useState(200);
  const [stripMetadata, setStripMetadata] = useState(true);
  const [compressDpi, setCompressDpi] = useState(150);
  const [compressQuality, setCompressQuality] = useState(0.72);
  const imageInput = useRef<HTMLInputElement>(null);

  const handleImage = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onPendingAsset(String(reader.result));
      onToolChange("image");
    };
    reader.readAsDataURL(file);
  };

  const useSignature = () => {
    const dataUrl = signatureMode === "draw" ? drawnSignature : typedSignatureDataUrl(signatureText || "Assinatura");
    if (!dataUrl) return;
    onPendingAsset(dataUrl);
    onToolChange("signature");
  };

  return (
    <div className="panel-content">
      <div className="panel-heading">
        <span className="eyebrow">{t("Conteúdo")}</span>
        <h2>{t("Editar")}</h2>
        <p className="muted small">{t("Sobreposição, assinatura, redação segura e compressão.")}</p>
      </div>

      <div className="segmented">
        <button type="button" className={tab === "content" ? "is-active" : ""} onClick={() => setTab("content")}>{t("Conteúdo")}</button>
        <button type="button" className={tab === "redact" ? "is-active" : ""} onClick={() => setTab("redact")}>{t("Redigir")}</button>
        <button type="button" className={tab === "compress" ? "is-active" : ""} onClick={() => setTab("compress")}>{t("Comprimir")}</button>
      </div>

      {tab === "content" && (
        <>
          <Section title={t("Adicionar à página")}>
            <div className="tool-grid">
              <button type="button" className={`tool-button ${tool === "text" ? "is-active" : ""}`} onClick={() => onToolChange("text")}>
                <Type size={18} /><span>{t("Texto")}</span>
              </button>
              <button type="button" className={`tool-button ${tool === "image" ? "is-active" : ""}`} onClick={() => imageInput.current?.click()}>
                <FileImage size={18} /><span>{t("Imagem")}</span>
              </button>
              <button type="button" className={`tool-button ${tool === "whiteout" ? "is-active" : ""}`} onClick={() => onToolChange("whiteout")}>
                <Wand2 size={18} /><span>{t("Cobrir")}</span>
              </button>
              <button type="button" className={`tool-button ${tool === "select" ? "is-active" : ""}`} onClick={() => onToolChange("select")}>
                <SlidersHorizontal size={18} /><span>{t("Selecionar")}</span>
              </button>
            </div>
            <input
              ref={imageInput}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              hidden
              onChange={(event) => {
                handleImage(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            {pendingAsset && tool === "image" && (
              <div className="asset-preview">
                <img src={pendingAsset} alt={t("Imagem pronta para inserir")} />
                <Button variant="ghost" className="small" onClick={() => onPendingAsset(null)}>{t("Remover")}</Button>
                <p className="muted small">{t("Clique na página para posicionar.")}</p>
              </div>
            )}
          </Section>

          <Section title={t("Estilo do texto")}>
            <Field label={t("Cor")}><ColorSwatches value={color} onChange={onColorChange} colors={palette} /></Field>
            <Field label={t("Tamanho · {n} pt", { n: fontSize })}>
              <input type="range" min={7} max={48} step={1} value={fontSize} onChange={(event) => onFontSizeChange(Number(event.target.value))} />
            </Field>
            <Field label={t("Opacidade · {n}%", { n: Math.round(opacity * 100) })}>
              <input type="range" min={0.1} max={1} step={0.05} value={opacity} onChange={(event) => onOpacityChange(Number(event.target.value))} />
            </Field>
          </Section>

          <Section title={t("Assinatura visual")}>
            <div className="segmented small">
              <button type="button" className={signatureMode === "draw" ? "is-active" : ""} onClick={() => setSignatureMode("draw")}><PenLine size={14} /> {t("Desenhar")}</button>
              <button type="button" className={signatureMode === "type" ? "is-active" : ""} onClick={() => setSignatureMode("type")}><Type size={14} /> {t("Digitar")}</button>
            </div>
            {signatureMode === "draw" ? (
              <SignaturePad color={color} onChange={setDrawnSignature} />
            ) : (
              <Field label={t("Nome da assinatura")}>
                <input value={signatureText} onChange={(event) => setSignatureText(event.target.value)} placeholder={t("Seu nome")} />
              </Field>
            )}
            <Button variant="secondary" className="small" onClick={useSignature} disabled={signatureMode === "draw" ? !drawnSignature : !signatureText.trim()}>
              {t("Usar assinatura")}
            </Button>
            {(pendingAsset && tool === "signature") && (
              <div className="asset-preview signature-preview">
                <img src={pendingAsset} alt={t("Prévia da assinatura")} />
                <Button variant="ghost" className="small" onClick={() => onPendingAsset(null)}>{t("Remover")}</Button>
                <p className="muted small">{t("Clique na página para posicionar.")}</p>
              </div>
            )}
            <p className="panel-footnote">
              {t("Assinatura visual (imagem). Não é uma assinatura digital certificada. Para validade jurídica com certificado, use um provedor ICP-Brasil.")}
            </p>
          </Section>

          <p className="panel-footnote">
            {t("A edição é feita por sobreposição, como uma camada. Ela não reflui o texto original — para remover conteúdo de verdade, use a aba Redigir.")}
          </p>
        </>
      )}

      {tab === "redact" && (
        <>
          <Section title={t("Redação irreversível")}>
            <div className="callout warning">
              <ShieldAlert size={18} />
              <div>
                <strong>{t("Remoção real, não apenas um retângulo preto.")}</strong>
                <p>{t("As páginas marcadas são rasterizadas e o conteúdo sob as áreas é descartado. O texto deixa de ser pesquisável nessas páginas.")}</p>
              </div>
            </div>
            <Button variant={tool === "redact" ? "primary" : "secondary"} onClick={() => onToolChange("redact")}>
              <ScanLine size={16} /> {tool === "redact" ? t("Marcando áreas…") : t("Marcar área de redação")}
            </Button>
            <p className="muted small">{t("{n} área(s) marcada(s). Arraste retângulos sobre a página.", { n: redactionCount })}</p>
            {redactionCount > 0 && (
              <Button variant="ghost" className="small" onClick={onClearRedactions}>{t("Limpar marcações")}</Button>
            )}
          </Section>
          <Section title={t("Qualidade da rasterização")}>
            <Field label={t("DPI")}>
              <select value={redactDpi} onChange={(event) => setRedactDpi(Number(event.target.value))}>
                <option value={150}>{t("150 DPI · menor arquivo")}</option>
                <option value={200}>{t("200 DPI · equilíbrio")}</option>
                <option value={300}>{t("300 DPI · alta qualidade")}</option>
              </select>
            </Field>
            <Toggle checked={stripMetadata} onChange={setStripMetadata} label={t("Remover metadados")} description={t("Título, autor, assunto e palavras-chave.")} />
            <Button variant="danger" onClick={() => onApplyRedactions({ dpi: redactDpi, stripMetadata })} disabled={busy || redactionCount === 0}>
              {t("Aplicar redação e baixar")}
            </Button>
          </Section>
        </>
      )}

      {tab === "compress" && (
        <>
          <Section title={t("Compressão por rasterização")}>
            <p className="muted small">
              {t("Recomendado para PDFs escaneados ou com muitas imagens. O texto deixa de ser vetorial/pesquisável no resultado.")}
            </p>
            <Field label={t("Resolução")}>
              <select value={compressDpi} onChange={(event) => setCompressDpi(Number(event.target.value))}>
                <option value={100}>{t("100 DPI · máximo")}</option>
                <option value={150}>{t("150 DPI · recomendado")}</option>
                <option value={200}>{t("200 DPI · qualidade")}</option>
              </select>
            </Field>
            <Field label={t("Qualidade JPEG · {n}%", { n: Math.round(compressQuality * 100) })}>
              <input type="range" min={0.4} max={0.92} step={0.02} value={compressQuality} onChange={(event) => setCompressQuality(Number(event.target.value))} />
            </Field>
            <Button variant="primary" onClick={() => onCompress({ dpi: compressDpi, quality: compressQuality })} disabled={busy}>
              {t("Comprimir e baixar")}
            </Button>
          </Section>
          <div className="callout">
            <SlidersHorizontal size={18} />
            <div>
              <strong>{t("Sem servidor.")}</strong>
              <p>{t("A compressão acontece no navegador. Para PDFs vetoriais, o resultado pode ficar maior.")}</p>
            </div>
          </div>
        </>
      )}

      {busy && progress && <ProgressBar value={progress.value ?? 0.1} label={progress.message} />}
    </div>
  );
};
