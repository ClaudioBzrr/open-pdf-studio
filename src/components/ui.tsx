import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useI18n } from "../i18n";

export const Button = ({
  children,
  variant = "secondary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  children: ReactNode;
}) => (
  <button type="button" className={`button ${variant} ${className}`.trim()} {...props}>
    {children}
  </button>
);

export const Section = ({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) => (
  <section className="panel-section">
    <div className="panel-section-title">
      <h3>{title}</h3>
      {action}
    </div>
    {children}
  </section>
);

export const Field = ({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) => (
  <label className="field">
    <span className="field-label">{label}</span>
    {children}
    {hint && <span className="field-hint">{hint}</span>}
  </label>
);

export const ProgressBar = ({ value, label }: { value: number; label?: string }) => (
  <div className="progress">
    {label && <p className="muted small">{label}</p>}
    <div className="progress-track">
      <span style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
    </div>
  </div>
);

export const Toggle = ({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}) => (
  <label className="toggle-row">
    <span>
      <strong>{label}</strong>
      {description && <span className="field-hint">{description}</span>}
    </span>
    <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
  </label>
);

export const ColorSwatches = ({
  value,
  onChange,
  colors,
}: {
  value: string;
  onChange: (color: string) => void;
  colors: string[];
}) => {
  const { t } = useI18n();
  return (
  <div className="swatches">
    {colors.map((color) => (
      <button
        key={color}
        type="button"
        className={`swatch ${value.toLowerCase() === color.toLowerCase() ? "is-active" : ""}`}
        style={{ background: color }}
        onClick={() => onChange(color)}
        aria-label={`Cor ${color}`}
        title={color}
      />
    ))}
    <label className="swatch custom" title={t("Cor personalizada")}>
      <input type="color" value={value} onChange={(event) => onChange(event.target.value)} />
      <span>+</span>
    </label>
  </div>
  );
};
