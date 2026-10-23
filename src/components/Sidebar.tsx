import type { ReactNode } from "react";
import { useI18n } from "../i18n";
import {
  FileStack,
  GitCompare,
  LayoutGrid,
  LockKeyhole,
  PenLine,
  ScanText,
  ShieldCheck,
  TextCursorInput,
  Wand2,
} from "lucide-react";

export type SidebarTab =
  | "view"
  | "annotate"
  | "pages"
  | "forms"
  | "edit"
  | "protect"
  | "ocr"
  | "compare"
  | "privacy";

const tabs: Array<{ id: SidebarTab; label: string; icon: typeof LayoutGrid }> = [
  { id: "view", label: "Visualizar", icon: LayoutGrid },
  { id: "annotate", label: "Anotar", icon: PenLine },
  { id: "pages", label: "Páginas", icon: FileStack },
  { id: "forms", label: "Formulários", icon: TextCursorInput },
  { id: "edit", label: "Editar", icon: Wand2 },
  { id: "protect", label: "Proteger", icon: LockKeyhole },
  { id: "ocr", label: "OCR", icon: ScanText },
  { id: "compare", label: "Comparar", icon: GitCompare },
  { id: "privacy", label: "Privacidade", icon: ShieldCheck },
];

interface Props {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  children: ReactNode;
}

export const Sidebar = ({ activeTab, onTabChange, children }: Props) => {
  const { t } = useI18n();
  return (
  <aside className="sidebar">
    <nav className="sidebar-rail" aria-label={t("Ferramentas")}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`rail-button ${activeTab === tab.id ? "is-active" : ""}`}
          onClick={() => onTabChange(tab.id)}
          title={t(tab.label)}
          aria-label={t(tab.label)}
          aria-current={activeTab === tab.id ? "page" : undefined}
        >
          <tab.icon size={19} />
          <span>{t(tab.label)}</span>
        </button>
      ))}
      <span className="rail-local"><ShieldCheck size={15} /> {t("local")}</span>
    </nav>
    <div className="sidebar-panel">{children}</div>
  </aside>
  );
};
