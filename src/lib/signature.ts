export const trimCanvas = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
  const context = canvas.getContext("2d");
  if (!context) return canvas;
  const { width, height } = canvas;
  const data = context.getImageData(0, 0, width, height).data;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < minX || maxY < minY) return canvas;
  const padding = 8;
  const left = Math.max(0, minX - padding);
  const top = Math.max(0, minY - padding);
  const right = Math.min(width, maxX + padding);
  const bottom = Math.min(height, maxY + padding);
  const trimmed = document.createElement("canvas");
  trimmed.width = right - left;
  trimmed.height = bottom - top;
  const trimmedContext = trimmed.getContext("2d");
  if (!trimmedContext) return canvas;
  trimmedContext.drawImage(canvas, left, top, trimmed.width, trimmed.height, 0, 0, trimmed.width, trimmed.height);
  return trimmed;
};

export const typedSignatureDataUrl = (text: string, color = "#111827"): string => {
  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 260;
  const context = canvas.getContext("2d");
  if (!context) return "";
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = color;
  context.textAlign = "center";
  context.textBaseline = "middle";
  let size = 96;
  context.font = `${size}px "Segoe Script", "Brush Script MT", "Lucida Handwriting", cursive`;
  while (size > 36 && context.measureText(text).width > canvas.width - 80) {
    size -= 4;
    context.font = `${size}px "Segoe Script", "Brush Script MT", "Lucida Handwriting", cursive`;
  }
  context.fillText(text, canvas.width / 2, canvas.height / 2);
  return trimCanvas(canvas).toDataURL("image/png");
};

export const signaturePadDataUrl = (canvas: HTMLCanvasElement): string =>
  trimCanvas(canvas).toDataURL("image/png");
