# OpenPDF Studio v0.1.0

**Release date:** 2026-10-23

## English

The first public release of OpenPDF Studio: a private, local-first PDF workspace that runs entirely in the browser.

### Highlights

- **100% client-side** — no document upload, account, telemetry or backend.
- **Installable PWA** — offline app shell; sample PDF cached; OCR models cached after first use.
- **Bilingual UI** — English and Brazilian Portuguese.
- **Open Run-inspired theme** — green `#0B6E4F`, coral `#FF7A45`, warm light surfaces and a dark mode.
- **Reader** — PDF.js rendering, text layer, selection/copy, zoom, rotation, thumbnails, outline, metadata, search and read-aloud.
- **Annotations** — highlight, underline, strikeout, comments, pen, shapes, text, images, visual signature and whiteout; move, undo/redo and flattened export.
- **Pages** — reorder, delete, duplicate, extract, split, merge and rotate with metadata preservation.
- **Forms** — AcroForm filling, appearance updates, flattening and download.
- **OCR** — local Portuguese/English Tesseract.js, text export and searchable PDF.
- **Security** — AES-256 passwords, permissions and password removal.
- **Redaction and compression** — irreversible rasterized redaction with metadata removal; DPI/JPEG compression.
- **Comparison** — visual per-page diff.
- **SEO/GEO** — English and Portuguese landing pages, structured data, FAQ, sitemap, robots and `llms.txt`/`llms-full.txt`.

### Download

- `open-pdf-studio-web.zip` — static web build. Unzip and serve at the root of any static host.
- Live app: https://claudiobzrr.github.io/open-pdf-studio/app/
- Landing: https://claudiobzrr.github.io/open-pdf-studio/ · [Português](https://claudiobzrr.github.io/open-pdf-studio/pt/)

### Known limits

- No full text reflow editing; text/image edits are overlays.
- No certified PAdES/ICP-Brasil signatures; visual signature only.
- No PDF/A, preflight, XFA, 3D/multimedia, Adobe DRM or Document Cloud.
- OCR accuracy depends on scan quality.
- Redaction rasterizes marked pages; compression may increase vector PDFs.

### Independence

OpenPDF Studio is not affiliated with Adobe. It does not copy proprietary Acrobat code, bypass DRM or unlock paid Adobe features. See `docs/adobe-acrobat-analysis.md`.

---

## Português

O primeiro release público do OpenPDF Studio: um workspace de PDF privado e local-first que roda inteiramente no navegador.

### Destaques

- **100% client-side** — sem upload de documento, conta, telemetria ou backend.
- **PWA instalável** — shell offline; PDF de exemplo em cache; modelos de OCR cacheados após o primeiro uso.
- **Interface bilíngue** — inglês e português do Brasil.
- **Tema inspirado no Open Run** — verde `#0B6E4F`, coral `#FF7A45`, superfícies claras quentes e modo escuro.
- **Leitor** — renderização PDF.js, camada de texto, seleção/cópia, zoom, rotação, miniaturas, sumário, metadados, busca e leitura em voz alta.
- **Anotações** — marca-texto, sublinhado, tachado, comentários, caneta, formas, texto, imagens, assinatura visual e cobertura; mover, undo/redo e exportação achatada.
- **Páginas** — reordenar, excluir, duplicar, extrair, dividir, mesclar e girar com preservação de metadados.
- **Formulários** — preenchimento AcroForm, atualização de aparências, achatamento e download.
- **OCR** — Tesseract.js local em português/inglês, exportação de texto e PDF pesquisável.
- **Segurança** — senhas AES-256, permissões e remoção de senha.
- **Redação e compressão** — redação irreversível por rasterização com remoção de metadados; compressão por DPI/JPEG.
- **Comparação** — diff visual página a página.
- **SEO/GEO** — landing em inglês e português, dados estruturados, FAQ, sitemap, robots e `llms.txt`/`llms-full.txt`.

### Download

- `open-pdf-studio-web.zip` — build web estático. Descompacte e sirva na raiz de qualquer host estático.
- App ao vivo: https://claudiobzrr.github.io/open-pdf-studio/app/
- Landing: https://claudiobzrr.github.io/open-pdf-studio/pt/ · [English](https://claudiobzrr.github.io/open-pdf-studio/)

### Limites conhecidos

- Sem edição de texto com reflow; texto/imagens são sobreposições.
- Sem assinatura certificada PAdES/ICP-Brasil; apenas assinatura visual.
- Sem PDF/A, preflight, XFA, 3D/multimídia, DRM da Adobe ou Document Cloud.
- Precisão do OCR depende da digitalização.
- A redação rasteriza as páginas marcadas; a compressão pode aumentar PDFs vetoriais.

### Independência

O OpenPDF Studio não é afiliado à Adobe. Não copia código proprietário do Acrobat, não contorna DRM e não desbloqueia recursos pagos. Veja `docs/adobe-acrobat-analysis.pt-BR.md`.
