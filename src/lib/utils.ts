export const uid = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

export const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const normalized = hex.replace("#", "").trim();
  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((part) => part + part)
          .join("")
      : normalized.padEnd(6, "0").slice(0, 6);
  const value = Number.parseInt(full, 16);
  return {
    r: ((value >> 16) & 255) / 255,
    g: ((value >> 8) & 255) / 255,
    b: (value & 255) / 255,
  };
};

export const downloadBlob = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
};

export const downloadBytes = (bytes: Uint8Array, fileName: string, type = "application/pdf"): void => {
  const copy = new Uint8Array(bytes);
  downloadBlob(new Blob([copy], { type }), fileName);
};

export const downloadText = (text: string, fileName: string): void => {
  downloadBlob(new Blob([text], { type: "text/plain;charset=utf-8" }), fileName);
};

export const dataUrlToBytes = (dataUrl: string): Uint8Array => {
  const comma = dataUrl.indexOf(",");
  const meta = dataUrl.slice(0, comma);
  const payload = dataUrl.slice(comma + 1);
  if (meta.includes(";base64")) {
    const binary = atob(payload);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }
  return new TextEncoder().encode(decodeURIComponent(payload));
};

export const baseName = (fileName: string): string =>
  fileName.replace(/\.pdf$/i, "").replace(/[\\/:*?"<>|]+/g, "-");

export const pdfFileName = (fileName: string, suffix: string): string =>
  `${baseName(fileName)}-${suffix}.pdf`;

export const canvasToDataUrl = async (
  canvas: HTMLCanvasElement,
  type = "image/png",
  quality?: number,
): Promise<string> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Não foi possível converter o canvas em imagem."));
          return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error ?? new Error("Falha ao ler a imagem."));
        reader.readAsDataURL(blob);
      },
      type,
      quality,
    );
  });

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => window.setTimeout(resolve, ms));
