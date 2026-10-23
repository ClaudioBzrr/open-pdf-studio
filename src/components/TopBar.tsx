import {
  Download,
  FolderOpen,
  Globe2,
  Monitor,
  Moon,
  PanelLeft,
  Redo2,
  ShieldCheck,
  Sun,
  Undo2,
} from "lucide-react";
import type { ThemeMode } from "../theme";
import { useI18n } from "../i18n";
import { formatBytes } from "../lib/utils";

interface Props {
  fileName?: string;
  numPages?: number;
  fileSize?: number;
  hasDocument: boolean;
  isProtected?: boolean;
  themeMode: ThemeMode;
  onCycleTheme: () => void;
  sidebarOpen: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onOpen: () => void;
  onDownload: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onToggleSidebar: () => void;
}

export const TopBar = ({
  fileName,
  numPages,
  fileSize,
  hasDocument,
  isProtected,
  themeMode,
  onCycleTheme,
  sidebarOpen,
  canUndo,
  canRedo,
  onOpen,
  onDownload,
  onUndo,
  onRedo,
  onToggleSidebar,
}: Props) => {
  const { t, lang, toggleLang } = useI18n();
  return (
  <header className="topbar">
    <div className="brand">
      <span className="brand-mark" aria-hidden="true">P</span>
      <span className="brand-text">
        <strong>OpenPDF</strong>
        <span>Studio</span>
      </span>
      <span className="local-badge"><ShieldCheck size={12} /> {t("100% local")}</span>
    </div>

    <div className="topbar-document">
      {hasDocument ? (
        <>
          <span className="document-name" title={fileName}>{fileName}</span>
          <span className="document-meta">
            {numPages} {t("página")}{numPages === 1 ? "" : "s"} · {formatBytes(fileSize ?? 0)}
            {isProtected && <span className="document-lock"><ShieldCheck size={10} /> {t("protegido")}</span>}
          </span>
        </>
      ) : (
        <span className="document-meta">{t("Nenhum documento aberto")}</span>
      )}
    </div>

    <div className="topbar-actions">
      <button
        type="button"
        className="icon-button theme-button"
        onClick={onCycleTheme}
        title={t(`Tema: ${themeMode === "system" ? "sistema" : themeMode === "light" ? "claro" : "escuro"}`)}
        aria-label={t("Alternar tema")}
      >
        {themeMode === "system" ? <Monitor size={18} /> : themeMode === "light" ? <Sun size={18} /> : <Moon size={18} />}
      </button>
      <button
        type="button"
        className="icon-button language-button"
        onClick={toggleLang}
        title={lang === "en" ? "Português" : "English"}
        aria-label={lang === "en" ? "Mudar para português" : "Switch to English"}
      >
        <Globe2 size={17} />
        <span>{lang === "en" ? "PT" : "EN"}</span>
      </button>
      <button type="button" className="icon-button" onClick={onToggleSidebar} title={t("Alternar painel")} aria-label={t("Alternar painel")}>
        <PanelLeft size={18} className={sidebarOpen ? "" : "muted-icon"} />
      </button>
      <button type="button" className="icon-button" onClick={onUndo} disabled={!canUndo} title={t("Desfazer")} aria-label={t("Desfazer")}>
        <Undo2 size={18} />
      </button>
      <button type="button" className="icon-button" onClick={onRedo} disabled={!canRedo} title={t("Refazer")} aria-label={t("Refazer")}>
        <Redo2 size={18} />
      </button>
      <button type="button" className="button secondary topbar-button" onClick={onOpen}>
        <FolderOpen size={16} /> <span>{t("Abrir")}</span>
      </button>
      <button type="button" className="button primary topbar-button" onClick={onDownload} disabled={!hasDocument}>
        <Download size={16} /> <span>{t("Baixar PDF")}</span>
      </button>
    </div>
  </header>
  );
};
