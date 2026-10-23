import { CheckCircle2, CloudOff, Cpu, EyeOff, FileWarning, LockKeyhole, ShieldCheck, WifiOff } from "lucide-react";
import { Section } from "../ui";
import { useI18n } from "../../i18n";

export const PrivacyPanel = () => {
  const { t } = useI18n();
  return (
  <div className="panel-content">
    <div className="panel-heading">
      <span className="eyebrow">{t("Confiança")}</span>
      <h2>{t("Privacidade")}</h2>
      <p className="muted small">{t("A arquitetura é a política: não existe backend de documentos.")}</p>
    </div>

    <div className="privacy-hero">
      <ShieldCheck size={30} />
      <div>
        <strong>{t("Seu PDF não sai do navegador.")}</strong>
        <p>{t("Leitura, edição, OCR, criptografia e comparação acontecem na memória do dispositivo.")}</p>
      </div>
    </div>

    <Section title={t("Garantias")}>
      <ul className="check-list">
        <li><CloudOff size={16} /><span>{t("Nenhum upload para servidor de documentos.")}</span></li>
        <li><EyeOff size={16} /><span>{t("Sem conta, sem login, sem telemetria e sem analytics.")}</span></li>
        <li><Cpu size={16} /><span>{t("Processamento local com WebAssembly e APIs do navegador.")}</span></li>
        <li><WifiOff size={16} /><span>{t("Funciona offline depois do primeiro carregamento.")}</span></li>
        <li><LockKeyhole size={16} /><span>{t("Senhas e chaves existem apenas em memória.")}</span></li>
        <li><CheckCircle2 size={16} /><span>{t("Código-fonte aberto e auditável.")}</span></li>
      </ul>
    </Section>

    <Section title={t("Como verificar")}>
      <ol className="privacy-steps">
        <li>{t("Abra as Ferramentas de Desenvolvedor do navegador (F12).")}</li>
        <li>{t("Vá até a aba Network e abra um PDF.")}</li>
        <li>{t("Observe que nenhuma requisição contém o conteúdo do arquivo.")}</li>
        <li>{t("Ative o modo offline e continue lendo/editando o documento já aberto.")}</li>
      </ol>
      <p className="panel-footnote">
        {t("O app é estático. Para uso institucional, publique os arquivos de build em qualquer host estático ou rode localmente com")} <code>npm run preview</code>.
      </p>
    </Section>

    <Section title={t("Armazenamento")}>
      <p className="muted small">
        {t("O documento fica apenas na memória da aba. Ao recarregar ou fechar, ele é descartado. Apenas preferências de interface (zoom, tema) podem ser gravadas no")} <code>localStorage</code>.
      </p>
    </Section>

    <Section title={t("Limites honestos")}>
      <ul className="warning-list">
        <li><FileWarning size={16} /><span>{t("Não remove DRM, não contorna licenças e não abre PDFs com restrições de terceiros.")}</span></li>
        <li><FileWarning size={16} /><span>{t("Assinatura visual não substitui assinatura digital certificada (ICP-Brasil/PAdES).")}</span></li>
        <li><FileWarning size={16} /><span>{t("Edição de texto é por sobreposição; não há reflow completo do conteúdo original.")}</span></li>
        <li><FileWarning size={16} /><span>{t("Formulários XFA, 3D, multimídia avançada e PDF/A não são suportados.")}</span></li>
        <li><FileWarning size={16} /><span>{t("OCR é local, mas manuscritos e layouts complexos podem falhar.")}</span></li>
      </ul>
    </Section>

    <Section title={t("Independência")}>
      <p className="muted small">
        {t("OpenPDF Studio é um projeto independente, sem afiliação com a Adobe. A superfície de recursos foi inspirada em leitores/editores de PDF modernos; nenhum código proprietário do Acrobat foi copiado, extraído ou reutilizado.")}
      </p>
      <p className="muted small">
        {t("Bibliotecas: PDF.js (Apache-2.0), pdf-lib/@cantoo (MIT), Tesseract.js (Apache-2.0), React (MIT), Vite (MIT), JSZip (MIT), idb (ISC).")}
      </p>
    </Section>
  </div>
  );
};
