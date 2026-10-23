import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { useI18n } from "../i18n";

export type ToastType = "info" | "error" | "success";

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface Props {
  toast: ToastMessage | null;
  onClose: () => void;
}

export const Toast = ({ toast, onClose }: Props) => {
  const { t } = useI18n();
  if (!toast) return null;
  const Icon = toast.type === "error" ? AlertCircle : toast.type === "success" ? CheckCircle2 : Info;
  return (
    <div className={`toast ${toast.type}`} role="status">
      <Icon size={17} />
      <span>{toast.message}</span>
      <button type="button" className="icon-button" onClick={onClose} aria-label={t("Fechar aviso")}>
        <X size={14} />
      </button>
    </div>
  );
};
