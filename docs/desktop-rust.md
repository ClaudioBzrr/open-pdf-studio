# Desktop app in Rust — architecture and recommendation

## Short answer

Yes, a native Rust desktop app is viable and a good long-term direction. But it should be a **separate native implementation**, not a wrapper around the web app. Reusing the React UI through Tauri would be a port, which is exactly what you asked to avoid.

For v0.2.0, the web/PWA app and the first native viewer milestone are shipped. The desktop app is a separate implementation, not a wrapper around the React UI. Full parity (forms, OCR, encryption, redaction, comparison, certified signatures) remains a multi-month native roadmap.

## Recommended stack

| Layer | Choice | Why |
|---|---|---|
| UI | `egui`/`eframe` or `Slint` | Pure Rust, no webview. `egui` is fastest to iterate; `Slint` gives more native-looking UI. |
| PDF engine | `pdfium-render` (PDFium) | Permissive license (BSD-style), strong rendering, text extraction, forms and annotations. Bundle PDFium per platform. |
| PDF editing | `lopdf` + PDFium form APIs | Low-level object editing without a web runtime. |
| OCR | `leptess`/Tesseract or `tesseract-rs` | Local OCR with bundled language data. |
| Crypto | RustCrypto + PDF encryption support | AES-256, password and permission handling. |
| Native UX | `rfd`, `winit`, OS file associations | Open PDFs by double-click, native dialogs, drag and drop, print. |
| Packaging | WiX/MSI on Windows, `.app`/DMG on macOS, AppImage/deb on Linux | Native installers and file associations. |

PDFium is the pragmatic engine. MuPDF is excellent but AGPL/commercial licensing; document the choice before shipping.

## Why not Tauri

Tauri is excellent for wrapping a web UI with Rust capabilities, but it uses a webview. That would reuse or re-create the web frontend, not build an independent native UI. It also inherits webview differences. If the goal is "native from scratch, identical feature set", use a native UI toolkit and a native PDF engine.

## Proposed workspace

```text
desktop/
  Cargo.toml                 workspace
  crates/
    pdf-core/                document, pages, annotations, forms, metadata
    pdf-engine/              PDFium bindings, rendering, text, search
    ocr/                     Tesseract integration
    crypto/                  AES-256, permissions, redaction
    ui/                      egui/Slint screens, commands, shortcuts
    platform/                file associations, drag/drop, print, single instance
  packaging/
    windows/                 WiX/MSI
    macos/                   app bundle / notarization
    linux/                   AppImage/deb
```

Keep `pdf-core` UI-independent and testable with synthetic PDFs. That mirrors the web app's domain boundaries without sharing code.

## Delivery phases

1. **Native viewer** — open by default, tabs, continuous scroll, zoom, rotation, thumbnails, outline, search, text selection, metadata.
2. **Markup and pages** — highlights, notes, drawing, shapes, page reorder/delete/extract/merge, undo/redo, PDF export.
3. **Forms and documents** — AcroForm filling/flattening, image/text overlays, visual signatures.
4. **Security and OCR** — AES-256 protection, permissions, redaction by rasterization, local OCR, searchable PDF.
5. **Comparison and polish** — visual diff, print, accessibility, native menus, automatic updates, code signing.
6. **Certified signatures** — PAdES/ICP-Brasil integration with a certificate provider.

## UX requirements specific to desktop

- Register `.pdf` as an openable file type and handle `argv`/`OpenDocument` events.
- Single-instance behavior: opening a second PDF focuses the existing window and adds a tab.
- Native drag and drop, recent files, print dialog, page setup and password prompts.
- Remember window geometry, theme and language.
- Keep documents local; no telemetry and no cloud sync by default.

## Risks

- PDFium binary distribution, code signing and notarization add release work.
- Forms/annotations and PDF encryption have many edge cases; conformance fixtures are essential.
- Certified signatures require a trust store, timestamping and a certificate provider; do not fake them with images.
- A native UI is a new design surface; do not assume the web layout translates 1:1.

## Status

Shipped in `v0.2.0` as a native Windows x64 app: `desktop/`, a single Rust crate built with `egui`/`eframe` and PDFium. It opens PDFs from the command line or Explorer, supports tabs, thumbnails, search, zoom, view rotation, rectangle annotations, sticky notes, page extraction and Save/Save As.

The app is intentionally a native viewer/annotator, not full parity with the web app yet. OCR, AES-256, redaction, compression, comparison, certified signatures, forms and full page organization are still on the roadmap. Packaging currently ships a zip with `openpdf-desktop.exe`, `pdfium.dll`, licenses and per-user install/uninstall scripts; MSI/DMG/AppImage and code signing are future work.
