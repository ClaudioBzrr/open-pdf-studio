# OpenPDF Studio

[![App ao vivo](https://img.shields.io/badge/app-ao%20vivo-0B6E4F?style=flat-square)](https://claudiobzrr.github.io/open-pdf-studio/app/)
[![Pages](https://img.shields.io/github/deployments/ClaudioBzrr/open-pdf-studio/github-pages?label=GitHub%20Pages&style=flat-square)](https://claudiobzrr.github.io/open-pdf-studio/pt/)
[![Último release](https://img.shields.io/github/v/release/ClaudioBzrr/open-pdf-studio?style=flat-square)](https://github.com/ClaudioBzrr/open-pdf-studio/releases)
[![Licença](https://img.shields.io/github/license/ClaudioBzrr/open-pdf-studio?style=flat-square)](LICENSE)
[![PWA](https://img.shields.io/badge/PWA-offline-FF7A45?style=flat-square)](https://claudiobzrr.github.io/open-pdf-studio/app/)

**Workspace de PDF privado e local-first no seu navegador.** Leia, anote, edite, assine, faça OCR, redija, comprima e proteja PDFs sem enviá-los para servidor. Open source, licença MIT e PWA instalável.

- **App ao vivo:** https://claudiobzrr.github.io/open-pdf-studio/app/
- **Landing:** https://claudiobzrr.github.io/open-pdf-studio/pt/ · [English](https://claudiobzrr.github.io/open-pdf-studio/)
- **Código:** https://github.com/ClaudioBzrr/open-pdf-studio
- **Releases:** https://github.com/ClaudioBzrr/open-pdf-studio/releases

![Visualizador do OpenPDF Studio](public/screenshots/viewer-light.webp)

> **Sem afiliação com a Adobe.** Esta é uma implementação independente com bibliotecas open-source. Não copia código proprietário do Acrobat, não contorna DRM e não desbloqueia recursos pagos da Adobe.

---

## Por que existe

O Adobe Acrobat é um produto nativo e fechado, com recursos pagos ligados a licenciamento e serviços. O OpenPDF Studio entrega **equivalentes funcionais abertos** para o trabalho cotidiano com PDF, com uma diferença central: o documento nunca sai do navegador.

| Princípio | Implementação |
|---|---|
| Sem upload | O PDF é lido via `File`/`ArrayBuffer` e processado em memória. |
| Sem backend | Build estático; publique em qualquer host estático. |
| Sem telemetria | Sem analytics, cookies de rastreamento ou chamadas com dados do documento. |
| Offline | Shell PWA em cache; modelos de OCR cacheados após o primeiro uso. |
| Auditável | Código TypeScript aberto e dependências open-source. |

---

## Recursos

### Ler e navegar
- Renderização com PDF.js, camada de texto e seleção/cópia.
- Zoom, ajuste à largura/página e rotação por página.
- Miniaturas com carregamento preguiçoso, sumário e metadados.
- Busca textual com resultados por página e destaques.
- Leitura da página atual em voz alta via Web Speech API.
- Atalhos (`←/→`, `Ctrl+O`, `Ctrl+S`, `Ctrl+Z`, `Ctrl+F`, `Delete`).

### Anotar e editar
- Marca-texto, sublinhado, tachado, comentários, caneta, retângulo, seta e texto.
- Mover anotação selecionada, excluir, desfazer/refazer.
- Imagens, cobertura branca e assinatura visual (desenhada ou digitada).
- Exportar PDF achatado ou anotações em JSON.
- Edição por sobreposição — sem reflow do texto original.

### Organizar páginas
- Reordenar por arrastar e soltar.
- Excluir, duplicar, extrair, dividir, mesclar e girar.
- Metadados preservados nas operações de página.

### Formulários
- Ler e preencher campos AcroForm: texto, checkbox, radio, dropdown e lista.
- Atualizar aparências, achatar e baixar.

### OCR
- Tesseract.js com modelos locais de português e inglês.
- Página atual ou todas as páginas.
- Exportar texto ou gerar **PDF pesquisável** com camada invisível.
- Nenhuma imagem de página é enviada.

### Segurança
- Criptografia **AES-256** com `@cantoo/pdf-lib`.
- Senhas de abertura e proprietário.
- Permissões de impressão, cópia, edição, anotação, formulários, acessibilidade e montagem.
- Remoção de senha com a senha atual.
- Aviso quando a exportação remove uma senha existente.

### Redação, compressão e comparação
- Redação irreversível por rasterização, com remoção opcional de metadados.
- Compressão com DPI e qualidade JPEG configuráveis.
- Comparação visual página a página com indicadores de similaridade.

### PWA e interface bilíngue
- PWA instalável com shell offline.
- Inglês e português do Brasil, alternáveis no app.
- Temas claro e escuro com a paleta do **Open Run** (verde `#0B6E4F`, coral `#FF7A45`, superfícies quentes).

---

## Modelo de privacidade

- Documentos ficam na memória da aba. Recarregar ou fechar descarta.
- Apenas preferências de UI (tema, idioma) usam `localStorage`.
- O service worker cacheia o shell do app e o PDF de exemplo; **nunca cacheia PDFs do usuário**.
- Assets de OCR são cacheados após o primeiro uso; rode o OCR uma vez online antes de ficar totalmente offline.
- O app é um build estático. Não existe backend de documentos para vazar.

Limite honesto: segurança do navegador não é uma sandbox de sistema operacional. Mantenha navegador e dependências atualizados.

---

## Como rodar

Requisitos: Node.js 22+ e npm.

```bash
npm install
npm run dev
```

Abra `http://127.0.0.1:5173/app/`.

Build de produção:

```bash
npm run build
npm run preview
```

`dist/` é um site estático com três entradas:

- `/` — landing em inglês
- `/pt/` — landing em português
- `/app/` — workspace de PDF

---

## GitHub Pages

O projeto é publicado no **GitHub Pages** por `.github/workflows/pages.yml`:

1. `npm ci`
2. `npm test`
3. `npm run build` com `VITE_BASE=/open-pdf-studio/`
4. Upload de `dist/` e deploy com `actions/deploy-pages`.

URLs ao vivo:

- https://claudiobzrr.github.io/open-pdf-studio/
- https://claudiobzrr.github.io/open-pdf-studio/pt/
- https://claudiobzrr.github.io/open-pdf-studio/app/

Para testar o subpath localmente:

```powershell
$env:VITE_BASE='/open-pdf-studio/'
npm run build
npm run preview
```

---

## Testes

```bash
npm test          # testes unitários Vitest
npm run sample    # regenera public/sample.pdf
```

Testes com Chrome real (requer `playwright-core` e `npm run dev`):

```bash
node scripts/test-ui.mjs
node scripts/test-tools.mjs
node scripts/test-final.mjs
node scripts/test-extra.mjs
node scripts/test-textlayer.mjs
node scripts/test-pages.mjs
node scripts/test-offline-sample.mjs
```

A suíte cobre carregamento, renderização, seleção de texto, busca, anotações, formulários, AES-256, OCR, redação, compressão, comparação, assinatura, exclusão de páginas e recarga offline do PWA.

---

## Arquitetura

```text
src/
  App.tsx                    orquestra documento/ferramentas
  i18n.tsx                   dicionário e provider EN/PT
  theme.ts                   tema sistema/claro/escuro
  components/
    PageCanvas.tsx           canvas + camada de texto + overlay SVG
    Viewer.tsx               toolbar, zoom, busca, leitura
    Sidebar.tsx              navegação de ferramentas
    panels/                  View, Annotate, Pages, Forms, Edit, Protect, OCR, Compare, Privacy
  lib/
    pdf.ts                   PDF.js load/render/text/outline/search
    annotations.ts           desenho/achatamento de anotações
    pages.ts                 reordenar, excluir, duplicar, extrair, dividir, mesclar
    forms.ts                 AcroForm
    protect.ts               AES-256
    redact.ts                redação irreversível
    compress.ts              compressão por rasterização
    ocr.ts                   Tesseract + PDF pesquisável
    compare.ts               diff visual
  landing.css                design system da landing
  landing.ts                 tema/menu/install/PWA da landing
app/index.html               shell do app
index.html                   landing em inglês
pt/index.html                landing em português
public/
  sample.pdf                 documento de exemplo (6 páginas)
  screenshots/               screenshots da landing (webp)
  icons/                     ícones PWA
  tessdata/                  modelos OCR locais
  vendor/tesseract/          worker + core WASM
  robots.txt, sitemap.xml
  llms.txt, llms-full.txt    contexto para LLM/GEO
  _headers, 404.html
docs/
  adobe-acrobat-analysis.md
  adobe-acrobat-analysis.pt-BR.md
  desktop-rust.md
  desktop-rust.pt-BR.md
```

### Tema

A paleta segue o design system do **Open Run**:

| Token | Claro | Escuro |
|---|---|---|
| Primária | `#0B6E4F` | `#7DDBAF` |
| Primária escura | `#064732` | `#003824` |
| Acento | `#FF7A45` | `#FFB59A` |
| Superfície | `#FFFBF8` | `#101412` |
| Variante | `#DDE5DF` | `#414944` |

---

## Documentação

- [Análise do Adobe Acrobat (PT)](docs/adobe-acrobat-analysis.pt-BR.md)
- [Adobe Acrobat analysis (EN)](docs/adobe-acrobat-analysis.md)
- [Arquitetura desktop Rust (PT)](docs/desktop-rust.pt-BR.md)
- [Desktop Rust architecture (EN)](docs/desktop-rust.md)
- [README em inglês](README.md)

---

## App desktop em Rust

Um app desktop nativo em Rust é viável e recomendado como implementação separada — **não** um port Tauri da UI web. A stack proposta é Rust + `egui`/`Slint` + PDFium, com associação de arquivos para abrir PDFs por padrão. A paridade completa é um projeto de vários meses; a v0.1.0 entrega o app web/PWA. Veja [docs/desktop-rust.pt-BR.md](docs/desktop-rust.pt-BR.md).

---

## Análise com REA

O aplicativo Adobe instalado era o **Adobe Acrobat 26.2.21931.0**:

- `C:\Program Files\Adobe\Acrobat DC\Acrobat\Acrobat.exe`
- PE32+ x64, SHA-256 `b4b6e679c69679091ca70fdfe847850943b729c1a5b21e179bc080a538454621`
- 49 recursos PE, 63 data directories
- Plug-ins: `AcroForm`, `Annots`, `DigSig`, `PPKLite`, `EScript`, `Search`, `Accessibility`, `ReadOutLoud`, `reflow`, `TouchUp`, `Checkers`, `Multimedia`, `StorageConnectors`, `MSRMS`, `Updater`, entre outros.

O REA não tinha Ghidra/IDA configurados; a análise ficou no nível de **identidade, recursos e superfície de componentes/plug-ins**. Nenhum algoritmo proprietário foi decompilado e nenhum contorno de licença/DRM foi tentado.

---

## Limitações conhecidas

- Sem edição de texto com **reflow**; texto/imagens são sobreposições.
- Sem **assinatura digital certificada** (PAdES/ICP-Brasil); apenas assinatura visual.
- Sem **PDF/A, Preflight, gerenciamento de cores** ou produção gráfica.
- Sem **XFA, 3D, multimídia avançada ou JavaScript de documento**.
- Sem **DRM/RMS, Document Cloud, Adobe Fonts ou armazenamento em nuvem**.
- Precisão do OCR depende da digitalização; manuscritos e layouts complexos podem falhar.
- Operações de página podem não preservar formulários/XFA complexos.
- A redação rasteriza as páginas marcadas; a compressão pode aumentar PDFs vetoriais.

---

## Releases

A `v0.1.0` é o primeiro release web/PWA. O workflow de release anexa `open-pdf-studio-web.zip` e gera notas em tags `v*`.

```bash
git tag v0.1.0
git push origin v0.1.0
```

---

## Licença

MIT. Veja [LICENSE](LICENSE). Bibliotecas de terceiros mantêm suas licenças originais (PDF.js Apache-2.0; pdf-lib/@cantoo MIT; Tesseract.js Apache-2.0; React/Vite MIT; JSZip MIT; idb ISC).
