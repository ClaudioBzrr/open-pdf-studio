use anyhow::{Context, Result, bail};
use eframe::egui::ColorImage;
use pdfium_render::prelude::*;
use std::env;
use std::path::{Path, PathBuf};

pub struct Engine {
    pub pdfium: &'static Pdfium,
}

pub struct RenderedPage {
    pub image: ColorImage,
    pub width: u32,
    pub height: u32,
}

pub struct DocumentSession {
    pub engine: &'static Pdfium,
    pub path: PathBuf,
    pub document: PdfDocument<'static>,
    pub page_count: usize,
}

impl Engine {
    pub fn new() -> Result<Self> {
        let library = find_pdfium_library()?;
        let bindings = Pdfium::bind_to_library(&library)
            .with_context(|| format!("failed to load PDFium from {}", library.display()))?;
        let pdfium = Box::leak(Box::new(Pdfium::new(bindings)));
        Ok(Self { pdfium })
    }

    pub fn open(&self, path: &Path) -> Result<DocumentSession> {
        let document = self
            .pdfium
            .load_pdf_from_file(path, None)
            .with_context(|| format!("failed to open {}", path.display()))?;
        let page_count = document.pages().len() as usize;
        Ok(DocumentSession {
            engine: self.pdfium,
            path: path.to_path_buf(),
            document,
            page_count,
        })
    }
}

impl DocumentSession {
    pub fn page_size(&self, page_index: usize) -> Result<(f32, f32)> {
        let page = self.document.pages().get(page_index as i32)?;
        Ok((page.width().value, page.height().value))
    }

    pub fn render(
        &self,
        page_index: usize,
        target_width: u32,
        rotation: PdfPageRenderRotation,
    ) -> Result<RenderedPage> {
        let page = self.document.pages().get(page_index as i32)?;
        let config = PdfRenderConfig::new()
            .set_target_width(target_width as i32)
            .rotate(rotation, true)
            .render_annotations(true)
            .render_form_data(true);
        let bitmap = page.render_with_config(&config)?;
        let image = bitmap.as_image()?.to_rgba8();
        let (width, height) = image.dimensions();
        Ok(RenderedPage {
            image: ColorImage::from_rgba_unmultiplied(
                [width as usize, height as usize],
                image.as_raw(),
            ),
            width,
            height,
        })
    }

    pub fn page_text(&self, page_index: usize) -> Result<String> {
        let page = self.document.pages().get(page_index as i32)?;
        Ok(page.text()?.all())
    }

    pub fn search(&self, query: &str) -> Vec<SearchHit> {
        let query = query.trim().to_lowercase();
        if query.is_empty() {
            return Vec::new();
        }
        let mut hits = Vec::new();
        for index in 0..self.page_count {
            let Ok(page) = self.document.pages().get(index as i32) else {
                continue;
            };
            let Ok(text) = page.text() else {
                continue;
            };
            let all = text.all();
            let lower = all.to_lowercase();
            let mut from = 0;
            while let Some(found) = lower[from..].find(&query) {
                let absolute = from + found;
                let start = absolute.saturating_sub(40);
                let end = (absolute + query.len() + 60).min(all.len());
                hits.push(SearchHit {
                    page_index: index,
                    snippet: format!(
                        "{}{}{}",
                        if start > 0 { "…" } else { "" },
                        all[start..end].replace('\n', " "),
                        if end < all.len() { "…" } else { "" }
                    ),
                });
                from = absolute + query.len().max(1);
                if from >= lower.len() {
                    break;
                }
            }
        }
        hits
    }

    pub fn add_square_annotation(
        &mut self,
        page_index: usize,
        rect: (f32, f32, f32, f32),
        fill: PdfColor,
    ) -> Result<()> {
        let pages = self.document.pages_mut();
        let mut page = pages.get(page_index as i32)?;
        let mut annotation = page.annotations_mut().create_square_annotation()?;
        annotation.set_bounds(PdfRect::new(
            PdfPoints::new(rect.1),
            PdfPoints::new(rect.0),
            PdfPoints::new(rect.3),
            PdfPoints::new(rect.2),
        ))?;
        annotation.set_fill_color(fill)?;
        annotation.set_stroke_color(fill)?;
        annotation.set_contents("OpenPDF highlight")?;
        Ok(())
    }

    pub fn add_text_annotation(
        &mut self,
        page_index: usize,
        rect: (f32, f32, f32, f32),
        text: &str,
    ) -> Result<()> {
        let pages = self.document.pages_mut();
        let mut page = pages.get(page_index as i32)?;
        let mut annotation = page.annotations_mut().create_text_annotation(text)?;
        annotation.set_bounds(PdfRect::new(
            PdfPoints::new(rect.1),
            PdfPoints::new(rect.0),
            PdfPoints::new(rect.3),
            PdfPoints::new(rect.2),
        ))?;
        annotation.set_fill_color(PdfColor::new(255, 247, 204, 255))?;
        annotation.set_stroke_color(PdfColor::new(212, 167, 11, 255))?;
        Ok(())
    }

    pub fn save(&self, path: &Path) -> Result<()> {
        self.document
            .save_to_file(path)
            .with_context(|| format!("failed to save {}", path.display()))
    }

    pub fn extract_page(&self, page_index: usize, path: &Path) -> Result<()> {
        let mut target = self.engine.create_new_pdf()?;
        target
            .pages_mut()
            .copy_page_from_document(&self.document, page_index as i32, 0)?;
        target.save_to_file(path)?;
        Ok(())
    }
}

#[derive(Clone, Debug)]
pub struct SearchHit {
    pub page_index: usize,
    pub snippet: String,
}

pub fn find_pdfium_library() -> Result<PathBuf> {
    if let Ok(path) = env::var("OPENPDF_PDFIUM_DLL") {
        let path = PathBuf::from(path);
        if path.exists() {
            return Ok(path);
        }
    }

    let names: &[&str] = if cfg!(windows) {
        &["pdfium.dll"]
    } else if cfg!(target_os = "macos") {
        &["libpdfium.dylib", "pdfium.dylib"]
    } else {
        &["libpdfium.so", "pdfium.so"]
    };

    let mut candidates = Vec::new();
    if let Ok(exe) = env::current_exe() {
        if let Some(dir) = exe.parent() {
            candidates.extend(names.iter().map(|name| dir.join(name)));
        }
    }
    if let Ok(cwd) = env::current_dir() {
        candidates.extend(names.iter().map(|name| cwd.join(name)));
        candidates.extend([
            cwd.join("desktop/vendor/pdfium/windows-x64/bin/pdfium.dll"),
            cwd.join("desktop/vendor/pdfium/linux-x64/lib/libpdfium.so"),
            cwd.join("desktop/vendor/pdfium/macos-arm64/lib/libpdfium.dylib"),
            cwd.join("vendor/pdfium/windows-x64/bin/pdfium.dll"),
        ]);
    }

    for candidate in candidates {
        if candidate.exists() {
            return Ok(candidate);
        }
    }

    bail!(
        "PDFium library not found. Place pdfium.dll next to the executable or set OPENPDF_PDFIUM_DLL."
    )
}
