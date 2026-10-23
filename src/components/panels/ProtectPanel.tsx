import { useState } from "react";
import { Download, KeyRound, LockKeyhole, UnlockKeyhole } from "lucide-react";
import {
  decryptPdf,
  defaultPermissions,
  encryptPdf,
  type PdfPermissions,
} from "../../lib/protect";
import { downloadBytes, pdfFileName } from "../../lib/utils";
import { Button, Field, Section, Toggle } from "../ui";
import { useI18n } from "../../i18n";

interface Props {
  bytes: Uint8Array;
  fileName: string;
  password?: string;
  onNotify: (message: string, type?: "info" | "error" | "success") => void;
}

export const ProtectPanel = ({ bytes, fileName, password, onNotify }: Props) => {
  const { t } = useI18n();
  const [userPassword, setUserPassword] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState(password ?? "");
  const [permissions, setPermissions] = useState<PdfPermissions>(defaultPermissions);
  const [busy, setBusy] = useState(false);

  const update = <K extends keyof PdfPermissions>(key: K, value: PdfPermissions[K]) => {
    setPermissions((current) => ({ ...current, [key]: value }));
  };

  const protect = async () => {
    if (userPassword.length < 4) {
      onNotify(t("Use uma senha de abertura com pelo menos 4 caracteres."), "error");
      return;
    }
    if (userPassword !== confirmPassword) {
      onNotify(t("As senhas de abertura não coincidem."), "error");
      return;
    }
    setBusy(true);
    try {
      const result = await encryptPdf(bytes, {
        userPassword,
        ownerPassword: ownerPassword || userPassword,
        permissions,
        password,
      });
      downloadBytes(result, pdfFileName(fileName, "protegido"));
      onNotify(t("PDF protegido com AES-256 e baixado."), "success");
    } catch (error) {
      onNotify(String((error as Error).message ?? error), "error");
    } finally {
      setBusy(false);
    }
  };

  const unprotect = async () => {
    setBusy(true);
    try {
      const result = await decryptPdf(bytes, currentPassword);
      downloadBytes(result, pdfFileName(fileName, "sem-senha"));
      onNotify(t("PDF descriptografado e baixado."), "success");
    } catch (error) {
      onNotify(t("Não foi possível descriptografar. Verifique a senha."), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel-content">
      <div className="panel-heading">
        <span className="eyebrow">{t("Segurança")}</span>
        <h2>{t("Proteger")}</h2>
        <p className="muted small">{t("Criptografia AES-256 e permissões aplicadas localmente.")}</p>
      </div>

      <div className="callout">
        <LockKeyhole size={18} />
        <div>
          <strong>{t("AES-256 no navegador.")}</strong>
          <p>{t("As senhas não são transmitidas nem armazenadas. O PDF é criptografado em memória.")}</p>
        </div>
      </div>

      <Section title={t("Proteger com senha")}>
        <Field label={t("Senha de abertura")} hint={t("Necessária para abrir o PDF.")}>
          <input type="password" value={userPassword} onChange={(event) => setUserPassword(event.target.value)} autoComplete="new-password" />
        </Field>
        <Field label={t("Confirmar senha")}>
          <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" />
        </Field>
        <Field label={t("Senha de proprietário")} hint={t("Opcional. Permite alterar permissões.")}>
          <input type="password" value={ownerPassword} onChange={(event) => setOwnerPassword(event.target.value)} autoComplete="new-password" />
        </Field>

        <Field label={t("Impressão")}>
          <select value={permissions.printing} onChange={(event) => update("printing", event.target.value as PdfPermissions["printing"])}>
            <option value="highResolution">{t("Permitida em alta qualidade")}</option>
            <option value="lowResolution">{t("Somente baixa resolução")}</option>
            <option value="none">{t("Bloqueada")}</option>
          </select>
        </Field>

        <div className="permission-list">
          <Toggle checked={permissions.copying} onChange={(value) => update("copying", value)} label={t("Copiar texto e gráficos")} />
          <Toggle checked={permissions.modifying} onChange={(value) => update("modifying", value)} label={t("Modificar conteúdo")} />
          <Toggle checked={permissions.annotating} onChange={(value) => update("annotating", value)} label={t("Adicionar anotações")} />
          <Toggle checked={permissions.fillingForms} onChange={(value) => update("fillingForms", value)} label={t("Preencher formulários")} />
          <Toggle checked={permissions.documentAssembly} onChange={(value) => update("documentAssembly", value)} label={t("Montar documento")} />
          <Toggle checked={permissions.contentAccessibility} onChange={(value) => update("contentAccessibility", value)} label={t("Acessibilidade")} />
        </div>

        <Button variant="primary" onClick={protect} disabled={busy}>
          <KeyRound size={16} /> {busy ? t("Protegendo…") : t("Proteger e baixar")}
        </Button>
      </Section>

      <Section title={t("Remover senha")}>
        <Field label={t("Senha atual")} hint={t("Para PDFs que você já consegue abrir.")}>
          <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
        </Field>
        <Button variant="secondary" onClick={unprotect} disabled={busy || !currentPassword}>
          <UnlockKeyhole size={16} /> {t("Descriptografar e baixar")}
        </Button>
      </Section>

      <p className="panel-footnote">
        {t("Permissões são aplicadas ao PDF, mas alguns visualizadores podem ignorá-las. A senha de abertura é a proteção principal.")}
      </p>
    </div>
  );
};
