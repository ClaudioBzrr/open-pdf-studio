# OpenPDF Studio v0.2.0

[English](#english) · [Português](#português)

---

## English

The first release with a native desktop app.

### Downloads

| Asset | Description |
|---|---|
| `open-pdf-studio-web.zip` | Static web build and PWA. Unzip and serve at the root of any static host. |
| `openpdf-desktop-windows-x64.zip` | Native Windows x64 app, including `pdfium.dll`, licenses and installer scripts. |

Desktop download:
https://github.com/ClaudioBzrr/open-pdf-studio/releases/latest/download/openpdf-desktop-windows-x64.zip

### Native desktop 0.2.0

Built from scratch in Rust with `egui`/`eframe` and PDFium. It is not a Tauri port and does not reuse the React UI.

- Native PDF rendering, opened from Explorer, drag and drop, or the command line.
- Tabs, recent files and page thumbnails.
- Zoom, fit width, fit page, page navigation, view rotation and full-text search.
- Copy the current page text.
- Rectangle annotations and sticky text notes saved into the PDF.
- Extract the current page to a new PDF.
- Save and Save As, English/Portuguese UI, light/dark theme.
- Per-user installer script for the PDF file association and an uninstall script.

Still on the desktop roadmap: OCR, AES-256 protection, redaction, compression, comparison, certified signatures, AcroForm filling, page reorder/delete/merge and print. The web app remains the reference for those workflows.

### Web and design

- The app welcome is now tool-first: all eight tools are visible, and clicking one opens the file picker and lands directly in the matching panel.
- The upload/open action is still on the home page, but no longer dominates it.
- Landing screenshots keep their original aspect ratio instead of stretching.
- The landing page has a dedicated desktop section with the Windows download and an honest scope note.

### Privacy

- 100% local on web and desktop. No document upload, account, telemetry or backend.
- The web app is a PWA and works offline after the first load.
- OCR models in the web app are cached after first use.
- MIT licensed.

### Limits

- Desktop is Windows x64 only for now and is not code-signed.
- No certified PAdES/ICP-Brasil signatures.
- No PDF/A, XFA, 3D/multimedia, Adobe DRM or Document Cloud.
- Visual redaction in the web app rasterizes marked pages.

### Checksums

```text
a0abc916690c20a87378cb521369859ac5fc3fea8df7f397e7b029c4dc892f13  open-pdf-studio-web.zip
63b983210378800f42bf0ac7d3069af4ece202f2334ff8cf52d112f613ae8d37  openpdf-desktop-windows-x64.zip
```

---

## Português

O primeiro release com app desktop nativo.

### Downloads

| Asset | Descrição |
|---|---|
| `open-pdf-studio-web.zip` | Build web estático e PWA. Descompacte e sirva na raiz de qualquer host estático. |
| `openpdf-desktop-windows-x64.zip` | App nativo Windows x64, incluindo `pdfium.dll`, licenças e scripts de instalação. |

Download do desktop:
https://github.com/ClaudioBzrr/open-pdf-studio/releases/latest/download/openpdf-desktop-windows-x64.zip

### Desktop nativo 0.2.0

Escrito do zero em Rust com `egui`/`eframe` e PDFium. Não é um port Tauri e não reutiliza a UI React.

- Renderização nativa, abrindo pelo Explorer, arrastando e soltando ou pela linha de comando.
- Abas, arquivos recentes e miniaturas de páginas.
- Zoom, ajustar à largura, navegação, rotação de visualização e busca.
- Copiar o texto da página atual.
- Anotações de retângulo e notas de texto adesivas salvas no PDF.
- Extrair a página atual em um novo PDF.
- Salvar e Salvar como, interface em inglês/português, tema claro/escuro.
- Instalador por usuário para associar PDFs e script de desinstalação.

Continuam no roadmap desktop: OCR, proteção AES-256, redação, compressão, comparação, assinaturas certificadas, preenchimento de AcroForm, reordenar/excluir/mesclar páginas e impressão. O app web continua sendo a referência para esses fluxos.

### Web e design

- A home do app agora destaca as ferramentas: as oito ferramentas ficam visíveis, e clicar em uma abre o seletor de arquivo e leva direto ao painel correspondente.
- O upload/abertura continua na página inicial, mas sem dominar o layout.
- Os screenshots da landing mantêm a proporção original em vez de esticar.
- A landing ganhou uma seção desktop com o download para Windows e uma nota honesta de escopo.

### Privacidade

- 100% local no web e no desktop. Sem upload de documento, conta, telemetria ou backend.
- O app web é uma PWA e funciona offline após o primeiro carregamento.
- Modelos de OCR no app web são cacheados após o primeiro uso.
- Licença MIT.

### Limites

- O desktop é Windows x64 por enquanto e não tem assinatura de código.
- Sem assinaturas certificadas PAdES/ICP-Brasil.
- Sem PDF/A, XFA, 3D/multimídia, DRM da Adobe ou Document Cloud.
- A redação visual no app web rasteriza as páginas marcadas.

### Checksums

```text
a0abc916690c20a87378cb521369859ac5fc3fea8df7f397e7b029c4dc892f13  open-pdf-studio-web.zip
63b983210378800f42bf0ac7d3069af4ece202f2334ff8cf52d112f613ae8d37  openpdf-desktop-windows-x64.zip
```
