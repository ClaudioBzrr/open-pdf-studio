# Third-party notices

OpenPDF Studio Desktop is MIT licensed. It is built with the following
open-source components. The release zip includes the full license texts in the
`licenses/` folder.

## PDFium

- Project: https://pdfium.googlesource.com/pdfium/
- License: BSD-3-Clause
- Copyright 2014 The PDFium Authors
- Full text: `licenses/pdfium/pdfium.txt`

The Windows binary is distributed by
[pdfium-binaries](https://github.com/bblanchon/pdfium-binaries). Its build
scripts and bundled dependencies are covered by their own licenses, included in
`licenses/pdfium/`.

## pdfium-render

- Project: https://github.com/ajrcarey/pdfium-render
- License: MIT OR Apache-2.0

## egui / eframe

- Project: https://github.com/emilk/egui
- License: MIT OR Apache-2.0

## IBM Plex Sans

- Project: https://github.com/IBM/plex
- License: SIL Open Font License 1.1
- Full text: `licenses/IBM-Plex-OFL.txt`

## rfd

- Project: https://github.com/PolyMeilex/rfd
- License: MIT

## image

- Project: https://github.com/image-rs/image
- License: MIT OR Apache-2.0

## sys-locale

- Project: https://github.com/1Password/sys-locale
- License: MIT OR Apache-2.0

## anyhow

- Project: https://github.com/dtolnay/anyhow
- License: MIT OR Apache-2.0

A complete dependency tree and license metadata can be generated with
`cargo metadata` and `cargo deny`. The app does not include Adobe code, does not
bypass DRM and is not affiliated with Adobe.
