import { useEffect, useState } from "react";
import { CheckSquare, Download, FileInput, RefreshCw, Square } from "lucide-react";
import type { FormFieldDescriptor } from "../../types";
import { fillForm, loadFormFields, type FormValue } from "../../lib/forms";
import { downloadBytes, pdfFileName } from "../../lib/utils";
import { Button, Field, Section } from "../ui";
import { useI18n } from "../../i18n";

interface Props {
  bytes: Uint8Array;
  fileName: string;
  password?: string;
  onNotify: (message: string, type?: "info" | "error" | "success") => void;
}

export const FormsPanel = ({ bytes, fileName, password, onNotify }: Props) => {
  const { t } = useI18n();
  const [fields, setFields] = useState<FormFieldDescriptor[]>([]);
  const [values, setValues] = useState<Record<string, FormValue>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [flatten, setFlatten] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadFormFields(bytes, password)
      .then((loaded) => {
        if (cancelled) return;
        setFields(loaded);
        setValues(
          Object.fromEntries(
            loaded.map((field) => [
              field.name,
              { name: field.name, type: field.type, value: field.value, checked: field.checked },
            ]),
          ),
        );
      })
      .catch((error) => {
        if (!cancelled) onNotify(String((error as Error).message ?? error), "error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bytes, password, onNotify]);

  const update = (name: string, patch: Partial<FormValue>) => {
    setValues((current) => ({
      ...current,
      [name]: { ...current[name], ...patch },
    }));
  };

  const save = async (flattenFields: boolean) => {
    setBusy(true);
    try {
      const result = await fillForm(bytes, Object.values(values), { password, flatten: flattenFields });
      downloadBytes(result, pdfFileName(fileName, flattenFields ? "formulario-achatado" : "formulario-preenchido"));
      onNotify(flattenFields ? t("Formulário preenchido e achatado.") : t("Formulário preenchido e baixado."), "success");
    } catch (error) {
      onNotify(String((error as Error).message ?? error), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel-content">
      <div className="panel-heading">
        <span className="eyebrow">{t("AcroForm")}</span>
        <h2>{t("Formulários")}</h2>
        <p className="muted small">{t("Preencha campos e baixe uma cópia com os valores aplicados.")}</p>
      </div>

      {loading ? (
        <p className="muted small"><RefreshCw size={14} className="spin" /> {t("Lendo campos do PDF…")}</p>
      ) : fields.length === 0 ? (
        <div className="empty-state">
          <FileInput size={26} />
          <h3>{t("Nenhum formulário AcroForm")}</h3>
          <p>{t("Este PDF não contém campos interativos, ou usa XFA (não suportado).")}</p>
        </div>
      ) : (
        <>
          <Section title={t("Campos ({n})", { n: fields.length })}>
            <div className="form-fields">
              {fields.map((field) => {
                const value = values[field.name];
                if (!value) return null;
                if (field.type === "checkbox") {
                  return (
                    <label key={field.name} className="checkbox-field">
                      <button
                        type="button"
                        className={`check-toggle ${value.checked ? "is-checked" : ""}`}
                        onClick={() => update(field.name, { checked: !value.checked, value: value.checked ? "false" : "true" })}
                      >
                        {value.checked ? <CheckSquare size={16} /> : <Square size={16} />}
                      </button>
                      <span>{field.name}</span>
                    </label>
                  );
                }
                if (field.type === "radio" || field.type === "dropdown" || field.type === "option-list") {
                  return (
                    <Field key={field.name} label={field.name}>
                      <select value={value.value} onChange={(event) => update(field.name, { value: event.target.value })}>
                        <option value="">—</option>
                        {(field.options ?? []).map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </Field>
                  );
                }
                if (field.type === "text") {
                  return (
                    <Field key={field.name} label={field.name}>
                      {field.multiline ? (
                        <textarea rows={3} value={value.value} onChange={(event) => update(field.name, { value: event.target.value })} />
                      ) : (
                        <input value={value.value} onChange={(event) => update(field.name, { value: event.target.value })} />
                      )}
                    </Field>
                  );
                }
                return (
                  <Field key={field.name} label={`${field.name} (${field.type})`}>
                    <input value={value.value} disabled />
                  </Field>
                );
              })}
            </div>
          </Section>
          <Section title={t("Exportar")}>
            <label className="checkbox-field">
              <input type="checkbox" checked={flatten} onChange={(event) => setFlatten(event.target.checked)} />
              <span>{t("Achatar campos ao salvar")}</span>
            </label>
            <div className="button-row">
              <Button variant="primary" onClick={() => save(flatten)} disabled={busy}>
                <Download size={16} /> {busy ? t("Salvando…") : t("Baixar preenchido")}
              </Button>
            </div>
            <p className="panel-footnote">
              {t("A aparência dos campos é atualizada antes de salvar. XFA não é suportado.")}
              {password ? t(" O arquivo de saída não manterá a senha atual; reaplique a proteção depois.") : ""}
            </p>
          </Section>
        </>
      )}
    </div>
  );
};
