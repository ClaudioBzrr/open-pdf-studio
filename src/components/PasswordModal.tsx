import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, X } from "lucide-react";
import { Button } from "./ui";
import { useI18n } from "../i18n";

interface Props {
  fileName: string;
  onSubmit: (password: string) => void;
  onCancel: () => void;
}

export const PasswordModal = ({ fileName, onSubmit, onCancel }: Props) => {
  const { t } = useI18n();
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="password-title">
      <div className="modal">
        <button type="button" className="icon-button modal-close" onClick={onCancel} aria-label={t("Fechar")}>
          <X size={17} />
        </button>
        <span className="modal-icon"><LockKeyhole size={24} /></span>
        <h2 id="password-title">{t("PDF protegido")}</h2>
        <p className="muted">
          <strong>{fileName}</strong> {t("precisa de uma senha para abrir. Ela é usada apenas neste navegador.")}
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (password) onSubmit(password);
          }}
        >
          <div className="password-field">
            <input
              autoFocus
              type={visible ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t("Senha do PDF")}
              aria-label={t("Senha do PDF")}
            />
            <button type="button" className="icon-button" onClick={() => setVisible((current) => !current)} aria-label={visible ? t("Ocultar senha") : t("Mostrar senha")}>
              {visible ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="modal-actions">
            <Button variant="ghost" onClick={onCancel}>{t("Cancelar")}</Button>
            <Button variant="primary" type="submit" disabled={!password}>{t("Abrir PDF")}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
