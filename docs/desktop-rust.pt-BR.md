# App desktop em Rust — arquitetura e recomendação

## Resposta curta

Sim, um app desktop nativo em Rust é viável e uma boa direção de longo prazo. Mas ele deve ser uma **implementação nativa separada**, não um wrapper da versão web. Reutilizar a UI React via Tauri seria um port — exatamente o que você pediu para evitar.

Na v0.1.0, entregamos o app web/PWA. O desktop deve ser um marco separado, porque a paridade completa (visualizador, anotações, formulários, OCR, criptografia, redação, comparação e assinaturas) é um projeto nativo de vários meses.

## Stack recomendada

| Camada | Escolha | Por quê |
|---|---|---|
| UI | `egui`/`eframe` ou `Slint` | Rust puro, sem webview. `egui` itera mais rápido; `Slint` tem aparência mais nativa. |
| Motor PDF | `pdfium-render` (PDFium) | Licença permissiva (BSD-like), boa renderização, texto, formulários e anotações. Empacote o PDFium por plataforma. |
| Edição | `lopdf` + APIs de formulário do PDFium | Edição de objetos sem runtime web. |
| OCR | `leptess`/Tesseract ou `tesseract-rs` | OCR local com modelos empacotados. |
| Cripto | RustCrypto + suporte a criptografia PDF | AES-256, senhas e permissões. |
| UX nativa | `rfd`, `winit`, associações de arquivo do SO | Abrir PDF com duplo clique, diálogos nativos, arrastar/soltar, impressão. |
| Empacotamento | WiX/MSI no Windows, `.app`/DMG no macOS, AppImage/deb no Linux | Instaladores nativos e associação de arquivos. |

PDFium é o motor pragmático. MuPDF é excelente, mas AGPL/comercial; documente a escolha antes de distribuir.

## Por que não Tauri

Tauri é ótimo para embrulhar uma UI web com capacidades Rust, mas usa webview. Isso reutilizaria ou recriaria o frontend web, não uma UI nativa independente. Também herda diferenças de webview. Se o objetivo é "nativo do zero, com o mesmo conjunto de recursos", use um toolkit nativo e um motor PDF nativo.

## Workspace proposto

```text
desktop/
  Cargo.toml                 workspace
  crates/
    pdf-core/                documento, páginas, anotações, formulários, metadados
    pdf-engine/              bindings PDFium, renderização, texto, busca
    ocr/                     integração Tesseract
    crypto/                  AES-256, permissões, redação
    ui/                      telas egui/Slint, comandos, atalhos
    platform/                associações, drag/drop, impressão, instância única
  packaging/
    windows/                 WiX/MSI
    macos/                   app bundle / notarização
    linux/                   AppImage/deb
```

Mantenha `pdf-core` independente da UI e testável com PDFs sintéticos. Isso espelha as fronteiras de domínio do app web sem compartilhar código.

## Fases de entrega

1. **Visualizador nativo** — abrir por padrão, abas, scroll contínuo, zoom, rotação, miniaturas, sumário, busca, seleção de texto, metadados.
2. **Marcações e páginas** — marca-texto, notas, desenho, formas, reordenar/excluir/extrair/mesclar, undo/redo, exportação PDF.
3. **Formulários e documentos** — preencher/achatar AcroForm, sobreposições de texto/imagem, assinatura visual.
4. **Segurança e OCR** — AES-256, permissões, redação por rasterização, OCR local, PDF pesquisável.
5. **Comparação e acabamento** — diff visual, impressão, acessibilidade, menus nativos, atualizações automáticas, assinatura de código.
6. **Assinatura certificada** — PAdES/ICP-Brasil com provedor de certificados.

## Requisitos de UX específicos do desktop

- Registrar `.pdf` como tipo abrível e tratar `argv`/`OpenDocument`.
- Instância única: abrir um segundo PDF foca a janela existente e adiciona uma aba.
- Drag and drop nativo, arquivos recentes, diálogo de impressão, configuração de página e prompt de senha.
- Lembrar geometria da janela, tema e idioma.
- Documentos locais; sem telemetria e sem sincronização em nuvem por padrão.

## Riscos

- Distribuição do binário PDFium, assinatura de código e notarização adicionam trabalho de release.
- Formulários/anotações e criptografia PDF têm muitos casos de borda; fixtures de conformidade são essenciais.
- Assinaturas certificadas exigem trust store, carimbo de tempo e provedor; não simule com imagem.
- Uma UI nativa é uma nova superfície de design; não assuma que o layout web se traduz 1:1.

## Status

Não incluído na v0.1.0. O release web/PWA é a entrega atual. O primeiro marco desktop deve ser um visualizador nativo que abre PDFs por padrão, depois edição/segurança.
