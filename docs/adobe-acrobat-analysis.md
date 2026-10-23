# Adobe Acrobat functional analysis (with REA)

> Engineering notes. No proprietary code, keys, secrets or license-bypass instructions are included.

## 1. Target and method

| Item | Observation |
|---|---|
| Installed product | **Adobe Acrobat 26.2.21931.0** (the user mentioned "Reader DC"; the installed binary is full Acrobat) |
| Path | `C:\Program Files\Adobe\Acrobat DC\Acrobat\Acrobat.exe` |
| Format | PE32+ x86-64 |
| SHA-256 | `b4b6e679c69679091ca70fdfe847850943b729c1a5b21e179bc080a538454621` |
| PE resources | 49 resources, 63 data directories, 2 icon groups |
| Observed plug-ins | `AcroForm`, `Annots`, `DigSig`, `PPKLite`, `EScript`, `Search`, `Accessibility`, `ReadOutLoud`, `reflow`, `TouchUp`, `Checkers`, `Multimedia`, `SaveAsRTF`, `SendMail`, `Spelling`, `Weblink`, `StorageConnectors`, `MSRMS`, `Updater` |

### What REA did

- Opened the executable with `open_binary` (read-only).
- Produced artifact and PE resource inventories (`inspect_artifact`, `inspect_pe_resources`).
- Confirmed that **Ghidra/IDA/Hopper were not configured** on this host; therefore no native decompilation occurred.
- The analysis stayed at **identity, component inventory and plug-in surface** level. That is enough to map capabilities, but not to copy proprietary algorithms.

### What REA did not do

- It did not execute Acrobat.
- It did not extract source code, keys or internal databases.
- It did not bypass activation, signatures, DRM or paid permissions.
- It did not attempt to reproduce the rendering engine or Document Cloud services.

## 2. How Acrobat is organized

The observed architecture (and public documentation) combines:

1. **PDF core** — COS object parser, xref/object streams, filters (Flate, LZW, JPEG, JBIG2, etc.), fonts, color spaces, content streams and the graphics model.
2. **Renderer** — interprets drawing, text, image, transparency, layer and annotation operators.
3. **Application plug-ins** — each `.api` extends the core:
   - `AcroForm` — interactive forms.
   - `Annots` — annotations and markup.
   - `DigSig`/`PPKLite` — digital signatures and PKI.
   - `EScript` — document JavaScript.
   - `Search` — indexing and search.
   - `Accessibility`/`ReadOutLoud`/`reflow` — accessibility and reflow.
   - `TouchUp` — object/content editing.
   - `Checkers` — preflight/production checks.
   - `Multimedia`/`Weblink` — media and links.
   - `StorageConnectors`/`DropboxStorage` — storage and cloud.
   - `MSRMS` — Microsoft Rights Management.
   - `Updater` — updates.
4. **Licensing/services layer** — "paid" Acrobat features depend on subscriptions, activation and sometimes online services. The app checks entitlements; it is not just a local flag.
5. **Sandbox/protection** — modern Reader/Acrobat uses protected processes, validation and exploit mitigations. PDFs are untrusted input.

## 3. Mapping to OpenPDF Studio

| Acrobat capability | OpenPDF equivalent | Status |
|---|---|---|
| Rendering and navigation | PDF.js, canvas, zoom, rotation, thumbnails | Implemented |
| Text search | `getTextContent` + per-page index + highlights | Implemented |
| Text selection/copy | PDF.js TextLayer | Implemented |
| Annotations | SVG overlay + pdf-lib flattening | Implemented |
| AcroForm | pdf-lib form API + appearances + flatten | Implemented |
| Page organization | pdf-lib copyPages/merge/split | Implemented |
| Text editing | text/image/whiteout overlays | Partial (no reflow) |
| OCR | local Tesseract.js + searchable PDF | Implemented |
| Redaction | irreversible rasterization + metadata removal | Implemented |
| Compression | DPI/quality rasterization | Implemented |
| Comparison | per-page visual diff | Implemented |
| Protection | AES-256 + permissions | Implemented |
| Signature | visual image signature | Partial (not certified) |
| Certified/PAdES signature | — | Not implemented |
| PDF/A, preflight, color | — | Not implemented |
| XFA, 3D, multimedia, document JS | — | Unsupported |
| Document Cloud/storage | — | Not implemented by design |
| DRM/RMS | — | Not implemented and not bypassed |

## 4. Limits and risks

- **1:1 parity is not feasible** without Adobe's proprietary engine, fonts, services and licenses.
- **Paid features** were treated as *open-source functional equivalents*, not as an unlock of Adobe features.
- **Visual signatures** have no cryptographic validity. For ICP-Brasil/PAdES, integrate a certified provider.
- **Redaction** is safe only because it rasterizes the page; a black rectangle over vector content does not remove the text.
- **OCR** is local but is not as accurate as commercial products on handwriting/complex layouts.
- **Malicious PDFs** remain untrusted input; keep PDF.js, the browser and dependencies updated.

## 5. Conclusion

Acrobat is a native application with a PDF core, renderer, plug-ins and a licensing/services layer. OpenPDF Studio independently reimplements the subset that can be delivered with open-source libraries and browser APIs, preserving privacy by architecture. What cannot be legitimately reproduced — DRM, paid services, proprietary codecs/fonts and Adobe-certified signatures — remains explicitly out of scope.
