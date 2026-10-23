# OpenPDF Studio Desktop

[English](#english) · [Português](#português)

Native desktop edition of OpenPDF Studio, written in Rust with `egui`/`eframe` and
PDFium. It is not a webview wrapper and does not reuse the React application.

---

## English

### Download

Get `openpdf-desktop-windows-x64.zip` from the
[latest release](https://github.com/ClaudioBzrr/open-pdf-studio/releases/latest).

The zip contains:

- `openpdf-desktop.exe`
- `pdfium.dll`
- `install-windows.ps1` / `uninstall-windows.ps1`
- licenses and this README

Unzip it to a folder and run `openpdf-desktop.exe`. The app is unsigned, so
Windows SmartScreen may ask for confirmation on first launch.

To install for the current user and register OpenPDF Studio as a PDF handler:

```powershell
powershell -ExecutionPolicy Bypass -File .\install-windows.ps1
```

This copies the app to `%LOCALAPPDATA%\OpenPDF Studio`, creates a Start Menu
shortcut and adds the app to Windows' "Open with" and "Default apps" lists.
Windows does not allow an installer to silently become the default handler, so
choose **Settings → Apps → Default apps → Choose defaults by file type → .pdf →
OpenPDF Studio** once. To remove it, run `uninstall-windows.ps1`.

### What works in 0.2.0

- Native PDF rendering with PDFium, opened from the app, drag and drop, or a
  file path passed on the command line.
- Multiple tabs, recent files and page thumbnails.
- Zoom, fit width, fit page, page navigation and view rotation.
- Full-text search with page snippets and jump-to-page.
- Copy the text of the current page.
- Rectangle annotations and sticky text notes, saved into the PDF.
- Extract the current page to a new PDF.
- Save and Save As, English/Portuguese UI, light/dark theme.

### Honest scope

The desktop app is a native **viewer and annotator**, not full parity with the
web app yet. Still on the desktop roadmap:

- OCR
- AES-256 encryption and permissions
- redaction and compression
- document comparison
- certified PAdES/ICP-Brasil signatures
- AcroForm filling
- page reorder, delete, merge and split
- print, auto-update and code signing

The web app remains the reference for those workflows. The desktop app is local
by design: no upload, no account, no telemetry.

### Build from source

Requirements: Rust 1.95+ with the MSVC toolchain, and the Visual Studio Build
Tools with the Windows SDK.

```powershell
cd desktop
powershell -ExecutionPolicy Bypass -File .\scripts\fetch-pdfium.ps1
cargo build --release
Copy-Item .\vendor\pdfium\windows-x64\bin\pdfium.dll .\target\release\
.\target\release\openpdf-desktop.exe ..\public\sample.pdf
```

`pdfium.dll` must sit next to the executable, or its path must be provided in
`OPENPDF_PDFIUM_DLL`. Set `OPENPDF_LANG=en` or `OPENPDF_LANG=pt` to override the
UI language detected from Windows.

### Command line

```text
openpdf-desktop [file.pdf]
openpdf-desktop --check <input.pdf>
openpdf-desktop --render <input.pdf> <output.png> [page]
openpdf-desktop --annotate <input.pdf> <output.pdf> [page]
```

`--annotate` is a smoke test for the annotation and save pipeline.

### License

MIT for the application. PDFium is BSD-3-Clause; IBM Plex Sans is SIL OFL 1.1.
See `THIRD-PARTY-NOTICES.md` and the `licenses/` folder in the release zip.

---

## Português

### Download

Baixe `openpdf-desktop-windows-x64.zip` no
[release mais recente](https://github.com/ClaudioBzrr/open-pdf-studio/releases/latest).

O zip contém:

- `openpdf-desktop.exe`
- `pdfium.dll`
- `install-windows.ps1` / `uninstall-windows.ps1`
- licenças e este README

Descompacte em uma pasta e execute `openpdf-desktop.exe`. O app não é assinado
digitalmente, então o SmartScreen do Windows pode pedir confirmação na primeira
execução.

Para instalar para o usuário atual e registrar o OpenPDF Studio como opção para
PDFs:

```powershell
powershell -ExecutionPolicy Bypass -File .\install-windows.ps1
```

O script copia o app para `%LOCALAPPDATA%\OpenPDF Studio`, cria um atalho no
Menu Iniciar e adiciona o app às listas "Abrir com" e "Aplicativos padrão" do
Windows. O Windows não permite que um instalador se torne o padrão
silenciosamente; escolha uma vez em **Configurações → Aplicativos → Aplicativos
padrão → Definir padrões por tipo de arquivo → .pdf → OpenPDF Studio**. Para
remover, execute `uninstall-windows.ps1`.

### O que funciona na 0.2.0

- Renderização nativa com PDFium, abrindo pelo app, arrastando e soltando ou
  passando o caminho na linha de comando.
- Abas, arquivos recentes e miniaturas de páginas.
- Zoom, ajustar à largura, ajustar à página, navegação e rotação de visualização.
- Busca com trechos por página e salto direto para a página.
- Copiar o texto da página atual.
- Anotações de retângulo e notas de texto adesivas, salvas no PDF.
- Extrair a página atual em um novo PDF.
- Salvar e Salvar como, interface em inglês/português e tema claro/escuro.

### Escopo honesto

O app desktop é um **visualizador e anotador** nativo, ainda sem paridade total
com o app web. Continuam no roadmap desktop:

- OCR
- criptografia AES-256 e permissões
- redação e compressão
- comparação de documentos
- assinaturas certificadas PAdES/ICP-Brasil
- preenchimento de AcroForm
- reordenar, excluir, mesclar e dividir páginas
- impressão, atualização automática e assinatura de código

O app web continua sendo a referência para esses fluxos. O app desktop é local
por princípio: sem upload, sem conta, sem telemetria.

### Compilar do código-fonte

Requisitos: Rust 1.95+ com toolchain MSVC e Visual Studio Build Tools com o
Windows SDK.

```powershell
cd desktop
powershell -ExecutionPolicy Bypass -File .\scripts\fetch-pdfium.ps1
cargo build --release
Copy-Item .\vendor\pdfium\windows-x64\bin\pdfium.dll .\target\release\
.\target\release\openpdf-desktop.exe ..\public\sample.pdf
```

O `pdfium.dll` precisa ficar ao lado do executável, ou o caminho deve ser
informado em `OPENPDF_PDFIUM_DLL`. Defina `OPENPDF_LANG=en` ou `OPENPDF_LANG=pt`
para sobrescrever o idioma detectado no Windows.

### Linha de comando

```text
openpdf-desktop [arquivo.pdf]
openpdf-desktop --check <entrada.pdf>
openpdf-desktop --render <entrada.pdf> <saida.png> [pagina]
openpdf-desktop --annotate <entrada.pdf> <saida.pdf> [pagina]
```

`--annotate` é um teste rápido do fluxo de anotação e salvamento.

### Licença

MIT para o aplicativo. PDFium é BSD-3-Clause; IBM Plex Sans é SIL OFL 1.1.
Consulte `THIRD-PARTY-NOTICES.md` e a pasta `licenses/` no zip do release.
