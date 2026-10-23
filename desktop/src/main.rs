mod app;
mod i18n;
mod pdf;
mod theme;

use anyhow::{Context, Result};
use app::OpenPdfApp;
use eframe::egui;
use pdfium_render::prelude::*;
use std::env;
use std::path::PathBuf;

fn main() -> Result<()> {
    let args: Vec<String> = env::args().skip(1).collect();

    if args.iter().any(|arg| arg == "--help" || arg == "-h") {
        println!("OpenPDF Studio Desktop");
        println!("  openpdf-desktop [file.pdf]");
        println!("  openpdf-desktop --check <input.pdf>");
        println!("  openpdf-desktop --render <input.pdf> <output.png> [page]");
        println!("  openpdf-desktop --annotate <input.pdf> <output.pdf> [page]");
        return Ok(());
    }

    if args.first().map(|arg| arg.as_str()) == Some("--check") {
        let path = args.get(1).context("missing input PDF")?;
        let engine = pdf::Engine::new()?;
        let session = engine.open(std::path::Path::new(path))?;
        println!(
            "{} pages, path {}",
            session.page_count,
            session.path.display()
        );
        return Ok(());
    }

    if args.first().map(|arg| arg.as_str()) == Some("--render") {
        let input = args.get(1).context("missing input PDF")?;
        let output = args.get(2).context("missing output PNG")?;
        let page_index = args
            .get(3)
            .and_then(|value| value.parse::<usize>().ok())
            .unwrap_or(0);
        let library = pdf::find_pdfium_library()?;
        let pdfium = Pdfium::new(Pdfium::bind_to_library(&library)?);
        let document = pdfium.load_pdf_from_file(input, None)?;
        let page = document.pages().get(page_index as i32)?;
        let bitmap = page.render_with_config(
            &PdfRenderConfig::new()
                .set_target_width(1400)
                .render_annotations(true)
                .render_form_data(true),
        )?;
        bitmap.as_image()?.save(output)?;
        println!("rendered page {} to {}", page_index + 1, output);
        return Ok(());
    }

    if args.first().map(|arg| arg.as_str()) == Some("--annotate") {
        let input = args.get(1).context("missing input PDF")?;
        let output = args.get(2).context("missing output PDF")?;
        let page_index = args
            .get(3)
            .and_then(|value| value.parse::<usize>().ok())
            .unwrap_or(0);
        let engine = pdf::Engine::new()?;
        let mut session = engine.open(std::path::Path::new(input))?;
        let (width, height) = session.page_size(page_index)?;
        session.add_square_annotation(
            page_index,
            (width * 0.1, height * 0.55, width * 0.45, height * 0.75),
            PdfColor::new(250, 204, 21, 255),
        )?;
        session.add_text_annotation(
            page_index,
            (width * 0.1, height * 0.35, width * 0.6, height * 0.5),
            "OpenPDF annotation smoke test",
        )?;
        session.save(std::path::Path::new(output))?;
        let reopened = engine.open(std::path::Path::new(output))?;
        let annotations = reopened
            .document
            .pages()
            .get(page_index as i32)?
            .annotations()
            .len();
        println!(
            "saved {} with {} annotations on page {}",
            output,
            annotations,
            page_index + 1
        );
        return Ok(());
    }

    let initial = args
        .iter()
        .find(|arg| !arg.starts_with('-'))
        .map(PathBuf::from);
    let options = eframe::NativeOptions {
        viewport: egui::ViewportBuilder::default()
            .with_title("OpenPDF Studio")
            .with_min_inner_size([620.0, 480.0])
            .with_maximized(true)
            .with_icon(theme::window_icon().unwrap_or_else(|| egui::IconData {
                rgba: vec![255, 255, 255, 255],
                width: 1,
                height: 1,
            })),
        persist_window: false,
        ..Default::default()
    };

    eframe::run_native(
        "OpenPDF Studio",
        options,
        Box::new(move |cc| {
            let app = OpenPdfApp::new(cc, initial.clone()).map_err(|error| {
                Box::<dyn std::error::Error + Send + Sync>::from(error.to_string())
            })?;
            Ok(Box::new(app))
        }),
    )
    .map_err(|error| anyhow::anyhow!(error.to_string()))
}
