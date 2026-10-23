import sharp from "sharp";
import { access, mkdir, unlink } from "node:fs/promises";
import { join } from "node:path";

const publicDir = "public";
const iconsDir = join(publicDir, "icons");
const screenshotsDir = join(publicDir, "screenshots");
await mkdir(iconsDir, { recursive: true });

const iconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="brand" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0B6E4F"/>
      <stop offset="0.55" stop-color="#1B8A5A"/>
      <stop offset="1" stop-color="#FF7A45"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#brand)"/>
  <circle cx="430" cy="82" r="150" fill="#FFDBCF" opacity="0.18"/>
  <circle cx="72" cy="456" r="120" fill="#B8F0D6" opacity="0.16"/>
  <path d="M148 96h154l72 72v248H148z" fill="#FFFBF8"/>
  <path d="M302 96v72h72" fill="#DDE5DF"/>
  <path d="M190 238h146M190 286h146M190 334h92" stroke="#0B6E4F" stroke-width="17" stroke-linecap="round"/>
  <rect x="296" y="322" width="72" height="72" rx="18" fill="#FF7A45"/>
  <path d="M318 358h28M332 344v28" stroke="#FFFFFF" stroke-width="9" stroke-linecap="round"/>
</svg>`;

const maskableSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="brand" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0B6E4F"/>
      <stop offset="0.55" stop-color="#1B8A5A"/>
      <stop offset="1" stop-color="#FF7A45"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#brand)"/>
  <circle cx="430" cy="82" r="150" fill="#FFDBCF" opacity="0.18"/>
  <g transform="translate(77 77) scale(0.7)">
    <path d="M148 96h154l72 72v248H148z" fill="#FFFBF8"/>
    <path d="M302 96v72h72" fill="#DDE5DF"/>
    <path d="M190 238h146M190 286h146M190 334h92" stroke="#0B6E4F" stroke-width="17" stroke-linecap="round"/>
    <rect x="296" y="322" width="72" height="72" rx="18" fill="#FF7A45"/>
    <path d="M318 358h28M332 344v28" stroke="#FFFFFF" stroke-width="9" stroke-linecap="round"/>
  </g>
</svg>`;

const iconBuffer = Buffer.from(iconSvg);
await sharp(iconBuffer).resize(192, 192).png().toFile(join(iconsDir, "pwa-192.png"));
await sharp(iconBuffer).resize(512, 512).png().toFile(join(iconsDir, "pwa-512.png"));
await sharp(iconBuffer).resize(180, 180).png().toFile(join(iconsDir, "apple-touch-icon.png"));
await sharp(Buffer.from(maskableSvg)).resize(512, 512).png().toFile(join(iconsDir, "maskable-512.png"));

const screenshot = await sharp(join(screenshotsDir, "viewer-light.webp"))
  .resize(560, 390, { fit: "cover", position: "top" })
  .png()
  .toBuffer();

const ogSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#064732"/>
      <stop offset="0.55" stop-color="#0B6E4F"/>
      <stop offset="1" stop-color="#0F8A61"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#B8F0D6"/>
      <stop offset="1" stop-color="#FFB59A"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1130" cy="60" r="220" fill="#FF7A45" opacity="0.18"/>
  <circle cx="1030" cy="620" r="190" fill="#B8F0D6" opacity="0.1"/>
  <text x="64" y="108" fill="#B8F0D6" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700" letter-spacing="3">LOCAL-FIRST · OPEN SOURCE · PWA</text>
  <text x="64" y="188" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-size="52" font-weight="800">OpenPDF Studio</text>
  <text x="64" y="250" fill="url(#accent)" font-family="Arial, Helvetica, sans-serif" font-size="31" font-weight="800">Your PDFs. In your browser.</text>
  <text x="64" y="302" fill="#D7E8DE" font-family="Arial, Helvetica, sans-serif" font-size="17">Read, annotate, edit, sign, OCR, redact and protect</text>
  <text x="64" y="328" fill="#D7E8DE" font-family="Arial, Helvetica, sans-serif" font-size="17">PDFs without uploading them. No account. No server.</text>
  <g font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="700" fill="#064732">
    <rect x="64" y="382" width="132" height="34" rx="17" fill="#B8F0D6"/>
    <text x="80" y="404">100% local</text>
    <rect x="208" y="382" width="150" height="34" rx="17" fill="#FFDBCF"/>
    <text x="224" y="404">AES-256</text>
    <rect x="370" y="382" width="126" height="34" rx="17" fill="#B8F0D6"/>
    <text x="386" y="404">PWA offline</text>
  </g>
  <text x="64" y="572" fill="#9BC8B3" font-family="Arial, Helvetica, sans-serif" font-size="18">github.com/ClaudioBzrr/open-pdf-studio</text>
  <rect x="590" y="106" width="572" height="404" rx="18" fill="#FFFFFF" opacity="0.97"/>
</svg>`;

const ogBase = await sharp(Buffer.from(ogSvg)).png().toBuffer();
await sharp(ogBase)
  .composite([{ input: screenshot, left: 596, top: 113 }])
  .png()
  .toFile(join(publicDir, "og-image.png"));

for (const name of ["viewer-light", "viewer-dark", "welcome-light", "welcome-dark", "mobile-welcome", "mobile-viewer"]) {
  const input = join(screenshotsDir, `${name}.png`);
  try {
    await access(input);
  } catch {
    continue;
  }
  try {
    await sharp(input).webp({ quality: 84 }).toFile(join(screenshotsDir, `${name}.webp`));
    await unlink(input);
  } catch (error) {
    console.warn(`Skipping ${name}:`, error.message);
  }
}

console.log("icons, og-image and webp screenshots generated");
