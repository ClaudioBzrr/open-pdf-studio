import { X, Search, ChevronRight } from "lucide-react";
import type { SearchHit } from "../lib/pdf";
import { useI18n } from "../i18n";

interface Props {
  query: string;
  onQueryChange: (value: string) => void;
  hits: SearchHit[];
  searching: boolean;
  progress: number;
  onSearch: () => void;
  onClose: () => void;
  onSelect: (hit: SearchHit) => void;
}

export const SearchPanel = ({
  query,
  onQueryChange,
  hits,
  searching,
  progress,
  onSearch,
  onClose,
  onSelect,
}: Props) => {
  const { t } = useI18n();
  return (
  <div className="search-panel">
    <div className="search-panel-header">
      <Search size={16} />
      <strong>{t("Buscar no documento")}</strong>
      <button type="button" className="icon-button" onClick={onClose} aria-label={t("Fechar busca")}>
        <X size={16} />
      </button>
    </div>
    <form
      className="search-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch();
      }}
    >
      <input
        autoFocus
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder={t("Digite uma palavra ou frase…")}
        aria-label={t("Buscar")}
      />
      <button type="submit" className="button small" disabled={searching || !query.trim()}>
        {searching ? t("Buscando…") : t("Buscar")}
      </button>
    </form>
    {searching && (
      <div className="search-progress">
        <div className="progress-track"><span style={{ width: `${Math.round(progress * 100)}%` }} /></div>
      </div>
    )}
    {!searching && hits.length === 0 && query.trim() && (
      <p className="muted small">{t("Nenhuma ocorrência encontrada.")}</p>
    )}
    {hits.length > 0 && (
      <>
        <p className="muted small">{hits.length} {t("ocorrência(s)")}</p>
        <div className="search-results">
          {hits.slice(0, 200).map((hit, index) => (
            <button
              type="button"
              key={`${hit.pageNumber}-${hit.index}-${index}`}
              className="search-result"
              onClick={() => onSelect(hit)}
            >
              <span>
                <strong>{t("Página {n}", { n: hit.pageNumber })}</strong>
                <span className="search-snippet">{hit.snippet}</span>
              </span>
              <ChevronRight size={14} />
            </button>
          ))}
        </div>
      </>
    )}
  </div>
  );
};
