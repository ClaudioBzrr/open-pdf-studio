use crate::i18n::Lang;
use crate::pdf::{DocumentSession, Engine, SearchHit};
use crate::theme::{self, Palette};
use eframe::egui::{
    self, Align, Color32, CornerRadius, Frame, Key, Layout, Margin, Pos2, Rect,
    RichText, ScrollArea, Sense, Stroke, TextureHandle, TextureOptions, Vec2,
};
use pdfium_render::prelude::{PdfColor, PdfPageRenderRotation};
use rfd::FileDialog;
use std::collections::HashMap;
use std::path::PathBuf;

#[derive(Clone, Copy, PartialEq, Eq)]
enum Tool {
    Select,
    Rectangle,
    Note,
}

struct PageTexture {
    key: (usize, u32, u16),
    handle: TextureHandle,
    size: Vec2,
}

struct DocumentTab {
    session: DocumentSession,
    page_index: usize,
    zoom: f32,
    fit_width: bool,
    fit_page: bool,
    rotation: u16,
    texture: Option<PageTexture>,
    thumbnails: HashMap<usize, TextureHandle>,
    search_results: Vec<SearchHit>,
    dirty: bool,
}

impl DocumentTab {
    fn new(session: DocumentSession) -> Self {
        Self {
            session,
            page_index: 0,
            zoom: 1.0,
            fit_width: true,
            fit_page: false,
            rotation: 0,
            texture: None,
            thumbnails: HashMap::new(),
            search_results: Vec::new(),
            dirty: false,
        }
    }

    fn name(&self) -> String {
        self.session
            .path
            .file_name()
            .map(|name| name.to_string_lossy().to_string())
            .unwrap_or_else(|| "PDF".to_owned())
    }

    fn rotation_enum(&self) -> PdfPageRenderRotation {
        match self.rotation {
            90 => PdfPageRenderRotation::Degrees90,
            180 => PdfPageRenderRotation::Degrees180,
            270 => PdfPageRenderRotation::Degrees270,
            _ => PdfPageRenderRotation::None,
        }
    }
}

pub struct OpenPdfApp {
    engine: Engine,
    tabs: Vec<DocumentTab>,
    active: usize,
    lang: Lang,
    dark: bool,
    palette: Palette,
    status: String,
    tool: Tool,
    note_text: String,
    highlight: Color32,
    search_query: String,
    show_pages: bool,
    show_tools: bool,
    about_open: bool,
    drag_start: Option<Pos2>,
    recent: Vec<PathBuf>,
}

impl OpenPdfApp {
    pub fn new(cc: &eframe::CreationContext<'_>, initial: Option<PathBuf>) -> anyhow::Result<Self> {
        theme::configure_fonts(&cc.egui_ctx);
        let dark = system_prefers_dark();
        let palette = theme::apply(&cc.egui_ctx, dark);
        let engine = Engine::new()?;
        let mut app = Self {
            engine,
            tabs: Vec::new(),
            active: 0,
            lang: Lang::detect(),
            dark,
            palette,
            status: String::new(),
            tool: Tool::Select,
            note_text: String::new(),
            highlight: Color32::from_rgb(250, 204, 21),
            search_query: String::new(),
            show_pages: false,
            show_tools: true,
            about_open: false,
            drag_start: None,
            recent: Vec::new(),
        };
        if let Some(path) = initial {
            app.open_path(path);
        }
        app.status = app.lang.t("Ready").to_owned();
        Ok(app)
    }

    fn open_dialog(&mut self) {
        if let Some(path) = FileDialog::new()
            .add_filter("PDF", &["pdf"])
            .add_filter("All files", &["*"])
            .pick_file()
        {
            self.open_path(path);
        }
    }

    fn open_path(&mut self, path: PathBuf) {
        match self.engine.open(&path) {
            Ok(session) => {
                self.tabs.push(DocumentTab::new(session));
                self.active = self.tabs.len() - 1;
                self.recent.retain(|item| item != &path);
                self.recent.insert(0, path);
                self.recent.truncate(8);
                self.status = self.lang.t("Ready").to_owned();
            }
            Err(error) => {
                self.status = format!("{}: {error}", self.lang.t("Open failed"));
            }
        }
    }

    fn save(&mut self, save_as: bool) {
        let Some(tab) = self.tabs.get_mut(self.active) else {
            return;
        };
        let path = if save_as || !tab.session.path.exists() {
            FileDialog::new()
                .add_filter("PDF", &["pdf"])
                .set_file_name(tab.name())
                .save_file()
        } else {
            Some(tab.session.path.clone())
        };
        let Some(path) = path else {
            return;
        };
        match tab.session.save(&path) {
            Ok(()) => {
                tab.dirty = false;
                tab.session.path = path;
                self.status = self.lang.t("Saved").to_owned();
            }
            Err(error) => {
                self.status = format!("{}: {error}", self.lang.t("Save failed"));
            }
        }
    }

    fn close_tab(&mut self, index: usize) {
        if index >= self.tabs.len() {
            return;
        }
        self.tabs.remove(index);
        if self.tabs.is_empty() {
            self.active = 0;
        } else if self.active >= self.tabs.len() {
            self.active = self.tabs.len() - 1;
        } else if index < self.active {
            self.active -= 1;
        }
    }

    fn top_bar(&mut self, ctx: &egui::Context) {
        let palette = self.palette;
        egui::TopBottomPanel::top("topbar")
            .frame(
                Frame::new()
                    .fill(palette.surface)
                    .inner_margin(Margin::symmetric(16, 10))
                    .stroke(Stroke::new(1.0_f32, palette.border)),
            )
            .show(ctx, |ui| {
                ui.horizontal(|ui| {
                    let mark = Frame::new()
                        .fill(palette.primary)
                        .corner_radius(CornerRadius::same(9))
                        .inner_margin(Margin::symmetric(8, 4));
                    mark.show(ui, |ui| {
                        ui.label(RichText::new("P").color(Color32::WHITE).strong().size(17.0));
                    });
                    ui.add_space(6.0);
                    ui.vertical(|ui| {
                        ui.label(RichText::new("OpenPDF").strong().size(16.0));
                        ui.label(
                            RichText::new("Studio")
                                .size(9.5)
                                .color(palette.muted),
                        );
                    });
                    ui.add_space(12.0);
                    if ui.button(self.lang.t("Open PDF")).clicked() {
                        self.open_dialog();
                    }
                    if ui
                        .add_enabled(!self.tabs.is_empty(), egui::Button::new(self.lang.t("Save")))
                        .clicked()
                    {
                        self.save(false);
                    }
                    if ui
                        .add_enabled(!self.tabs.is_empty(), egui::Button::new(self.lang.t("Save as")))
                        .clicked()
                    {
                        self.save(true);
                    }
                    if ui
                        .selectable_label(self.show_pages, self.lang.t("Pages"))
                        .clicked()
                    {
                        self.show_pages = !self.show_pages;
                    }
                    if ui
                        .selectable_label(self.show_tools, self.lang.t("Tools"))
                        .clicked()
                    {
                        self.show_tools = !self.show_tools;
                    }
                    ui.with_layout(Layout::right_to_left(Align::Center), |ui| {
                        if ui.button(self.lang.t("About")).clicked() {
                            self.about_open = true;
                        }
                        if ui.button(self.lang.label()).clicked() {
                            self.lang = self.lang.toggle();
                        }
                        if ui
                            .button(if self.dark { "☀" } else { "☾" })
                            .on_hover_text(self.lang.t("Theme"))
                            .clicked()
                        {
                            self.dark = !self.dark;
                            self.palette = theme::apply(ctx, self.dark);
                        }
                        if !self.status.is_empty() {
                            ui.label(
                                RichText::new(&self.status)
                                    .size(10.5)
                                    .color(palette.muted),
                            );
                        }
                    });
                });
            });
    }

    fn tabs_bar(&mut self, ctx: &egui::Context) {
        if self.tabs.is_empty() {
            return;
        }
        let palette = self.palette;
        let mut close = None;
        egui::TopBottomPanel::top("tabs")
            .frame(
                Frame::new()
                    .fill(palette.surface_soft)
                    .inner_margin(Margin::symmetric(10, 4))
                    .stroke(Stroke::new(1.0_f32, palette.border)),
            )
            .show(ctx, |ui| {
                ScrollArea::horizontal().show(ui, |ui| {
                    ui.horizontal(|ui| {
                        for (index, tab) in self.tabs.iter().enumerate() {
                            let active = index == self.active;
                            let text = if tab.dirty {
                                format!("{} •", tab.name())
                            } else {
                                tab.name()
                            };
                            if ui
                                .add(
                                    egui::Button::new(
                                        RichText::new(text).size(11.5).color(if active {
                                            palette.text
                                        } else {
                                            palette.muted
                                        }),
                                    )
                                    .fill(if active {
                                        palette.surface
                                    } else {
                                        Color32::TRANSPARENT
                                    })
                                    .stroke(if active {
                                        Stroke::new(1.0_f32, palette.border)
                                    } else {
                                        Stroke::NONE
                                    }),
                                )
                                .clicked()
                            {
                                self.active = index;
                            }
                            if ui
                                .add(egui::Button::new("×").frame(false))
                                .on_hover_text(self.lang.t("Close tab"))
                                .clicked()
                            {
                                close = Some(index);
                            }
                            ui.add_space(2.0);
                        }
                        if ui.button("＋").on_hover_text(self.lang.t("Open PDF")).clicked() {
                            self.open_dialog();
                        }
                    });
                });
            });
        if let Some(index) = close {
            self.close_tab(index);
        }
    }

    fn welcome(&mut self, ctx: &egui::Context) {
        let palette = self.palette;
        egui::CentralPanel::default()
            .frame(Frame::new().fill(palette.bg))
            .show(ctx, |ui| {
                ui.add_space(28.0);
                ui.vertical_centered(|ui| {
                    ui.label(
                        RichText::new(self.lang.t("Your PDFs. On your desktop."))
                            .size(34.0)
                            .strong()
                            .color(palette.text),
                    );
                    ui.add_space(8.0);
                    ui.label(
                        RichText::new(self.lang.t(
                            "A native Rust PDF workspace with local rendering, annotations, search and page tools. No upload, no account.",
                        ))
                        .size(13.0)
                        .color(palette.muted),
                    );
                    ui.add_space(26.0);
                });

                let available = ui.available_width().min(760.0);
                ui.horizontal(|ui| {
                    ui.add_space((ui.available_width() - available) / 2.0);
                    ui.vertical(|ui| {
                        let drop_frame = Frame::new()
                            .fill(palette.surface)
                            .stroke(Stroke::new(1.0_f32, palette.primary))
                            .corner_radius(CornerRadius::same(16))
                            .inner_margin(Margin::same(20));
                        drop_frame.show(ui, |ui| {
                            ui.set_width(available);
                            ui.vertical_centered(|ui| {
                                ui.label(RichText::new("PDF").size(34.0).color(palette.primary));
                                ui.add_space(4.0);
                                ui.label(
                                    RichText::new(self.lang.t("Drop a PDF here"))
                                        .size(15.0)
                                        .strong(),
                                );
                                ui.label(
                                    RichText::new(self.lang.t("or choose a file"))
                                        .size(11.0)
                                        .color(palette.muted),
                                );
                                ui.add_space(10.0);
                                if ui
                                    .add(
                                        egui::Button::new(
                                            RichText::new(self.lang.t("Open PDF"))
                                                .color(Color32::WHITE)
                                                .strong(),
                                        )
                                        .fill(palette.primary)
                                        .corner_radius(CornerRadius::same(8))
                                        .min_size(Vec2::new(150.0, 34.0)),
                                    )
                                    .clicked()
                                {
                                    self.open_dialog();
                                }
                            });
                        });

                        ui.add_space(18.0);
                        ui.label(
                            RichText::new(self.lang.t("Tools"))
                                .size(11.0)
                                .strong()
                                .color(palette.muted),
                        );
                        ui.add_space(6.0);
                        let cards = [
                            ("Viewer", "Read and navigate"),
                            ("Annotate", "Rectangle and text notes"),
                            ("Search text", "Find text on every page"),
                            ("Page tools", "Rotate and extract pages"),
                        ];
                        egui::Grid::new("welcome-tools")
                            .num_columns(2)
                            .spacing(Vec2::new(10.0, 10.0))
                            .show(ui, |ui| {
                                for (index, (title, subtitle)) in cards.iter().enumerate() {
                                    let button = egui::Button::new(
                                        RichText::new(format!(
                                            "{}\n{}",
                                            self.lang.t(title),
                                            self.lang.t(subtitle)
                                        ))
                                        .size(11.0)
                                        .color(palette.text),
                                    )
                                    .fill(palette.surface)
                                    .stroke(Stroke::new(1.0_f32, palette.border))
                                    .corner_radius(CornerRadius::same(10))
                                    .min_size(Vec2::new(365.0, 52.0));
                                    if ui.add(button).clicked() {
                                        self.open_dialog();
                                    }
                                    if index % 2 == 1 {
                                        ui.end_row();
                                    }
                                }
                            });

                        if !self.recent.is_empty() {
                            ui.add_space(18.0);
                            ui.label(
                                RichText::new(self.lang.t("Recent files"))
                                    .size(11.0)
                                    .strong()
                                    .color(palette.muted),
                            );
                            for path in self.recent.clone() {
                                let label = path
                                    .file_name()
                                    .map(|name| name.to_string_lossy().to_string())
                                    .unwrap_or_else(|| path.display().to_string());
                                if ui
                                    .selectable_label(false, RichText::new(label).size(11.5))
                                    .on_hover_text(path.display().to_string())
                                    .clicked()
                                {
                                    self.open_path(path);
                                }
                            }
                        }
                        ui.add_space(20.0);
                        ui.label(
                            RichText::new(self.lang.t("Local-first. No upload."))
                                .size(10.0)
                                .color(palette.primary),
                        );
                        ui.label(
                            RichText::new(self.lang.t(
                                "Roadmap: OCR, AES-256, redaction, compression, comparison and certified signatures.",
                            ))
                            .size(10.0)
                            .color(palette.muted),
                        );
                    });
                });
            });
    }

    fn pages_sidebar(&mut self, ctx: &egui::Context) {
        if self.tabs.is_empty() || !self.show_pages {
            return;
        }
        let palette = self.palette;
        let lang = self.lang;
        egui::SidePanel::left("pages")
            .resizable(true)
            .default_width(160.0)
            .min_width(140.0)
            .max_width(240.0)
            .frame(
                Frame::new()
                    .fill(palette.surface_soft)
                    .inner_margin(Margin::symmetric(10, 10))
                    .stroke(Stroke::new(1.0_f32, palette.border)),
            )
            .show(ctx, |ui| {
                ui.horizontal(|ui| {
                    ui.label(RichText::new(self.lang.t("Pages")).strong().size(11.5));
                    ui.with_layout(Layout::right_to_left(Align::Center), |ui| {
                        if ui.button("−").clicked() {
                            self.show_pages = false;
                        }
                    });
                });
                ui.add_space(6.0);
                let mut new_thumbs = Vec::new();
                if let Some(tab) = self.tabs.get_mut(self.active) {
                    let mut rendered_this_frame = 0;
                    for index in 0..tab.session.page_count {
                        if tab.thumbnails.contains_key(&index) {
                            continue;
                        }
                        if rendered_this_frame >= 2 {
                            break;
                        }
                        if let Ok(rendered) =
                            tab.session.render(index, 120, PdfPageRenderRotation::None)
                        {
                            let texture = ctx.load_texture(
                                format!("thumb-{}-{}", self.active, index),
                                rendered.image,
                                TextureOptions::LINEAR,
                            );
                            new_thumbs.push((index, texture));
                            rendered_this_frame += 1;
                        }
                    }
                    for (index, texture) in new_thumbs {
                        tab.thumbnails.insert(index, texture);
                    }
                }
                let mut select_page = None;
                ScrollArea::vertical().auto_shrink([false, false]).show(ui, |ui| {
                    if let Some(tab) = self.tabs.get(self.active) {
                        for index in 0..tab.session.page_count {
                            let Some(texture) = tab.thumbnails.get(&index) else {
                                continue;
                            };
                            let size = texture.size_vec2();
                            let scale = (ui.available_width() - 8.0) / size.x.max(1.0);
                            let display = size * scale;
                            let selected = index == tab.page_index;
                            let response = ui.add(
                                egui::Image::new((texture.id(), display)).sense(Sense::click()),
                            );
                            if response.clicked() {
                                select_page = Some(index);
                            }
                            let label = format!("{} {}", lang.t("Page"), index + 1);
                            if ui
                                .selectable_label(selected, RichText::new(label).size(9.5))
                                .clicked()
                            {
                                select_page = Some(index);
                            }
                            ui.add_space(8.0);
                        }
                    }
                });
                if let Some(page) = select_page {
                    if let Some(tab) = self.tabs.get_mut(self.active) {
                        tab.page_index = page;
                        tab.texture = None;
                    }
                }
            });
    }

    fn tools_sidebar(&mut self, ctx: &egui::Context) {
        if self.tabs.is_empty() || !self.show_tools {
            return;
        }
        let palette = self.palette;
        let lang = self.lang;
        let mut extract = false;
        let mut copy_text = false;
        egui::SidePanel::right("tools")
            .resizable(true)
            .default_width(280.0)
            .min_width(240.0)
            .max_width(380.0)
            .frame(
                Frame::new()
                    .fill(palette.surface)
                    .inner_margin(Margin::symmetric(14, 12))
                    .stroke(Stroke::new(1.0_f32, palette.border)),
            )
            .show(ctx, |ui| {
                ui.horizontal(|ui| {
                    ui.label(RichText::new(self.lang.t("Tools")).strong().size(11.5));
                    ui.with_layout(Layout::right_to_left(Align::Center), |ui| {
                        if ui.button("−").clicked() {
                            self.show_tools = false;
                        }
                    });
                });
                ui.add_space(8.0);
                ui.label(RichText::new(self.lang.t("Annotate")).size(10.0).color(palette.muted));
                ui.horizontal_wrapped(|ui| {
                    ui.selectable_value(&mut self.tool, Tool::Select, self.lang.t("Select"));
                    ui.selectable_value(&mut self.tool, Tool::Rectangle, self.lang.t("Rectangle"));
                    ui.selectable_value(&mut self.tool, Tool::Note, self.lang.t("Text note"));
                });
                ui.add_space(6.0);
                ui.horizontal(|ui| {
                    ui.label(RichText::new(self.lang.t("Color")).size(10.0));
                    ui.color_edit_button_srgba(&mut self.highlight);
                });
                if self.tool == Tool::Note {
                    ui.add_space(6.0);
                    ui.label(RichText::new(self.lang.t("Note text")).size(10.0));
                    ui.add(
                        egui::TextEdit::multiline(&mut self.note_text)
                            .desired_rows(3)
                            .hint_text(self.lang.t("Click the page to place the note")),
                    );
                }
                ui.add_space(12.0);
                ui.separator();
                ui.add_space(8.0);
                ui.label(
                    RichText::new(self.lang.t("Search in document"))
                        .size(11.5)
                        .strong(),
                );
                ui.horizontal(|ui| {
                    let field_width = (ui.available_width() - 74.0).max(80.0);
                    let response = ui.add_sized(
                        [field_width, 22.0],
                        egui::TextEdit::singleline(&mut self.search_query)
                            .hint_text(self.lang.t("Search")),
                    );
                    let submitted = response.lost_focus()
                        && ui.input(|input| input.key_pressed(Key::Enter));
                    if submitted || ui.button(self.lang.t("Search")).clicked() {
                        if let Some(tab) = self.tabs.get_mut(self.active) {
                            tab.search_results = tab.session.search(&self.search_query);
                        }
                    }
                });
                if let Some(tab) = self.tabs.get(self.active) {
                    if tab.search_results.is_empty() && !self.search_query.trim().is_empty() {
                        ui.label(
                            RichText::new(self.lang.t("No matches"))
                                .size(10.0)
                                .color(palette.muted),
                        );
                    }
                    let mut jump = None;
                    for hit in tab.search_results.iter().take(80) {
                        let text = format!(
                            "{} {}\n{}",
                            lang.t("Page"),
                            hit.page_index + 1,
                            hit.snippet
                        );
                        if ui
                            .add(
                                egui::Button::new(RichText::new(text).size(10.0))
                                    .fill(palette.surface_soft)
                                    .stroke(Stroke::new(1.0_f32, palette.border))
                                    .corner_radius(CornerRadius::same(6)),
                            )
                            .clicked()
                        {
                            jump = Some(hit.page_index);
                        }
                    }
                    if let Some(page) = jump {
                        if let Some(tab) = self.tabs.get_mut(self.active) {
                            tab.page_index = page;
                            tab.texture = None;
                        }
                    }
                }
                ui.add_space(10.0);
                ui.separator();
                ui.add_space(8.0);
                if ui.button(self.lang.t("Copy page text")).clicked() {
                    copy_text = true;
                }
                if ui.button(self.lang.t("Extract current page")).clicked() {
                    extract = true;
                }
                ui.add_space(8.0);
                if let Some(tab) = self.tabs.get(self.active) {
                    ui.label(
                        RichText::new(format!(
                            "{} {} / {}",
                            lang.t("Page"),
                            tab.page_index + 1,
                            tab.session.page_count
                        ))
                        .size(10.0)
                        .color(palette.muted),
                    );
                    ui.label(
                        RichText::new(tab.session.path.display().to_string())
                            .size(9.0)
                            .color(palette.muted),
                    );
                }
                ui.add_space(10.0);
                ui.add(
                    egui::Label::new(
                        RichText::new(self.lang.t(
                            "This build focuses on a fast native viewer with annotations, search, page rotation and page extraction. OCR, protection, redaction, compression, comparison and certified signatures remain on the roadmap.",
                        ))
                        .size(9.5)
                        .color(palette.muted),
                    )
                    .wrap(),
                );
            });


        if copy_text {
            if let Some(tab) = self.tabs.get_mut(self.active) {
                match tab.session.page_text(tab.page_index) {
                    Ok(text) => {
                        ctx.copy_text(text);
                        self.status = self.lang.t("Copied").to_owned();
                    }
                    Err(error) => self.status = error.to_string(),
                }
            }
        }
        if extract {
            self.extract_current_page();
        }
    }

    fn extract_current_page(&mut self) {
        let Some(tab) = self.tabs.get(self.active) else {
            return;
        };
        let name = format!("{} - page {}.pdf", tab.name().trim_end_matches(".pdf"), tab.page_index + 1);
        if let Some(path) = FileDialog::new()
            .add_filter("PDF", &["pdf"])
            .set_file_name(name)
            .save_file()
        {
            match tab.session.extract_page(tab.page_index, &path) {
                Ok(()) => self.status = self.lang.t("Page extracted").to_owned(),
                Err(error) => self.status = error.to_string(),
            }
        }
    }

    fn viewer(&mut self, ctx: &egui::Context) {
        let palette = self.palette;
        egui::CentralPanel::default()
            .frame(Frame::new().fill(palette.bg))
            .show(ctx, |ui| {
                self.viewer_toolbar(ui);
                ui.separator();
                let Some(tab) = self.tabs.get_mut(self.active) else {
                    return;
                };
                let (pdf_width, pdf_height) = tab
                    .session
                    .page_size(tab.page_index)
                    .unwrap_or((595.0, 842.0));
                let available = ui.available_size();
                if tab.fit_width {
                    tab.zoom = (available.x - 34.0) / pdf_width;
                } else if tab.fit_page {
                    tab.zoom = ((available.x - 34.0) / pdf_width)
                        .min((available.y - 34.0) / pdf_height);
                }
                tab.zoom = tab.zoom.clamp(0.2, 5.0);
                let ppp = ctx.pixels_per_point();
                let target_width = (pdf_width * tab.zoom * ppp).clamp(180.0, 4200.0) as u32;
                let key = (tab.page_index, target_width, tab.rotation);
                if tab
                    .texture
                    .as_ref()
                    .map(|texture| texture.key != key)
                    .unwrap_or(true)
                {
                    match tab
                        .session
                        .render(tab.page_index, target_width, tab.rotation_enum())
                    {
                        Ok(rendered) => {
                            let handle = ctx.load_texture(
                                format!("page-{}-{}", self.active, tab.page_index),
                                rendered.image,
                                TextureOptions::LINEAR,
                            );
                            tab.texture = Some(PageTexture {
                                key,
                                size: Vec2::new(
                                    rendered.width as f32 / ppp,
                                    rendered.height as f32 / ppp,
                                ),
                                handle,
                            });
                        }
                        Err(error) => {
                            self.status = error.to_string();
                        }
                    }
                }
                let Some(texture) = tab.texture.as_ref() else {
                    return;
                };
                let size = texture.size;
                let id = texture.handle.id();
                let rotation = tab.rotation;
                let page_index = tab.page_index;
                let page_width = pdf_width;
                let page_height = pdf_height;
                let tool = self.tool;
                let note_text = self.note_text.clone();
                let highlight = self.highlight;
                let mut add_rect: Option<(f32, f32, f32, f32)> = None;
                let mut add_note: Option<(f32, f32)> = None;
                ScrollArea::both()
                    .auto_shrink([false, false])
                    .show(ui, |ui| {
                        ui.add_space(16.0);
                        ui.horizontal(|ui| {
                            ui.add_space((ui.available_width() - size.x).max(0.0) / 2.0);
                            let (rect, response) =
                                ui.allocate_exact_size(size, Sense::click_and_drag());
                            ui.painter().rect_filled(
                                rect.expand(6.0),
                                CornerRadius::same(3),
                                Color32::from_black_alpha(18),
                            );
                            ui.painter().image(
                                id,
                                rect,
                                Rect::from_min_max(Pos2::ZERO, Pos2::new(1.0, 1.0)),
                                Color32::WHITE,
                            );
                            if tool == Tool::Rectangle {
                                if response.drag_started() {
                                    self.drag_start = response.interact_pointer_pos();
                                }
                                if let (Some(start), Some(current)) =
                                    (self.drag_start, response.interact_pointer_pos())
                                {
                                    if response.dragged() {
                                        ui.painter().rect_stroke(
                                            Rect::from_two_pos(start, current),
                                            CornerRadius::same(2),
                                            Stroke::new(2.0_f32, highlight),
                                            egui::StrokeKind::Inside,
                                        );
                                    }
                                }
                                if response.drag_stopped() {
                                    if let (Some(start), Some(end)) =
                                        (self.drag_start, response.interact_pointer_pos())
                                    {
                                        let a = screen_to_pdf(
                                            start,
                                            rect,
                                            page_width,
                                            page_height,
                                            rotation,
                                        );
                                        let b = screen_to_pdf(
                                            end,
                                            rect,
                                            page_width,
                                            page_height,
                                            rotation,
                                        );
                                        add_rect = Some((
                                            a.0.min(b.0),
                                            a.1.min(b.1),
                                            a.0.max(b.0),
                                            a.1.max(b.1),
                                        ));
                                    }
                                    self.drag_start = None;
                                }
                            } else if tool == Tool::Note && response.clicked() {
                                if let Some(position) = response.interact_pointer_pos() {
                                    add_note = Some(screen_to_pdf(
                                        position,
                                        rect,
                                        page_width,
                                        page_height,
                                        rotation,
                                    ));
                                }
                            }
                        });
                        ui.add_space(24.0);
                    });
                if let Some(rect) = add_rect {
                    let color = highlight;
                    match tab.session.add_square_annotation(
                        page_index,
                        rect,
                        PdfColor::new(color.r(), color.g(), color.b(), 90),
                    ) {
                        Ok(()) => {
                            tab.dirty = true;
                            tab.texture = None;
                            self.status = self.lang.t("Ready").to_owned();
                        }
                        Err(error) => self.status = error.to_string(),
                    }
                }
                if let Some((x, y)) = add_note {
                    if note_text.trim().is_empty() {
                        self.status = self.lang.t("Note text").to_owned();
                    } else {
                        let size = 24.0_f32.min(page_width).min(page_height);
                        let left = (x - size / 2.0).clamp(0.0, page_width - size);
                        let bottom = (y - size / 2.0).clamp(0.0, page_height - size);
                        let rect = (left, bottom, left + size, bottom + size);
                        match tab.session.add_text_annotation(page_index, rect, &note_text) {
                            Ok(()) => {
                                tab.dirty = true;
                                tab.texture = None;
                                self.status = self.lang.t("Ready").to_owned();
                            }
                            Err(error) => self.status = error.to_string(),
                        }
                    }
                }
            });
    }

    fn viewer_toolbar(&mut self, ui: &mut egui::Ui) {
        let palette = self.palette;
        let lang = self.lang;
        let Some(tab) = self.tabs.get_mut(self.active) else {
            return;
        };
        ui.horizontal(|ui| {
            if ui.button("<").on_hover_text(lang.t("Previous page")).clicked() {
                if tab.page_index > 0 {
                    tab.page_index -= 1;
                    tab.texture = None;
                }
            }
            ui.label(
                RichText::new(format!(
                    "{} {} / {}",
                    lang.t("Page"),
                    tab.page_index + 1,
                    tab.session.page_count
                ))
                .size(11.0),
            );
            if ui.button(">").on_hover_text(lang.t("Next page")).clicked() {
                if tab.page_index + 1 < tab.session.page_count {
                    tab.page_index += 1;
                    tab.texture = None;
                }
            }
            ui.separator();
            if ui.button("-").on_hover_text(lang.t("Zoom")).clicked() {
                tab.zoom = (tab.zoom / 1.15).clamp(0.2, 5.0);
                tab.fit_width = false;
                tab.fit_page = false;
                tab.texture = None;
            }
            ui.label(RichText::new(format!("{:.0}%", tab.zoom * 100.0)).size(10.5));
            if ui.button("+").on_hover_text(lang.t("Zoom")).clicked() {
                tab.zoom = (tab.zoom * 1.15).clamp(0.2, 5.0);
                tab.fit_width = false;
                tab.fit_page = false;
                tab.texture = None;
            }
            if ui
                .selectable_label(tab.fit_width, lang.t("Fit width"))
                .clicked()
            {
                tab.fit_width = true;
                tab.fit_page = false;
                tab.texture = None;
            }
            if ui
                .selectable_label(tab.fit_page, lang.t("Fit page"))
                .clicked()
            {
                tab.fit_page = true;
                tab.fit_width = false;
                tab.texture = None;
            }
            if ui.button(lang.t("Rotate view")).clicked() {
                tab.rotation = (tab.rotation + 90) % 360;
                tab.texture = None;
            }
            ui.with_layout(Layout::right_to_left(Align::Center), |ui| {
                if tab.dirty {
                    ui.label(
                        RichText::new(lang.t("Unsaved changes"))
                            .size(10.0)
                            .color(palette.accent),
                    );
                }
            });
        });
    }

    fn about_window(&mut self, ctx: &egui::Context) {
        if !self.about_open {
            return;
        }
        let palette = self.palette;
        let mut open = self.about_open;
        egui::Window::new(self.lang.t("About"))
            .open(&mut open)
            .collapsible(false)
            .resizable(false)
            .default_width(430.0)
            .show(ctx, |ui| {
                ui.label(RichText::new("OpenPDF Studio Desktop").strong().size(18.0));
                ui.add_space(2.0);
                ui.label(
                    RichText::new(format!("Version {}", env!("CARGO_PKG_VERSION")))
                        .size(10.0)
                        .color(palette.muted),
                );
                ui.add_space(6.0);
                ui.label(
                    RichText::new(self.lang.t("Native viewer"))
                        .size(11.0)
                        .color(palette.muted),
                );
                ui.add_space(10.0);
                ui.label(
                    RichText::new(self.lang.t(
                        "This build focuses on a fast native viewer with annotations, search, page rotation and page extraction. OCR, protection, redaction, compression, comparison and certified signatures remain on the roadmap.",
                    ))
                    .size(11.0)
                    .color(palette.muted),
                );
                ui.add_space(10.0);
                ui.label(
                    RichText::new(self.lang.t("Native PDF viewer powered by PDFium"))
                        .size(10.0)
                        .color(palette.primary),
                );
                ui.label(
                    RichText::new("MIT · github.com/ClaudioBzrr/open-pdf-studio")
                        .size(9.5)
                        .color(palette.muted),
                );
            });
        self.about_open = open;
    }

    fn handle_dropped_files(&mut self, ctx: &egui::Context) {
        let files = ctx.input(|input| input.raw.dropped_files.clone());
        for file in files {
            if let Some(path) = file.path {
                if path
                    .extension()
                    .map(|extension| extension.to_string_lossy().eq_ignore_ascii_case("pdf"))
                    .unwrap_or(false)
                {
                    self.open_path(path);
                }
            }
        }
    }

    fn handle_shortcuts(&mut self, ctx: &egui::Context) {
        let (open, save, next, previous) = ctx.input(|input| {
            (
                input.modifiers.command && input.key_pressed(Key::O),
                input.modifiers.command && input.key_pressed(Key::S),
                input.key_pressed(Key::ArrowDown) || input.key_pressed(Key::PageDown),
                input.key_pressed(Key::ArrowUp) || input.key_pressed(Key::PageUp),
            )
        });
        if open {
            self.open_dialog();
        }
        if save {
            self.save(false);
        }
        if let Some(tab) = self.tabs.get_mut(self.active) {
            if next && tab.page_index + 1 < tab.session.page_count {
                tab.page_index += 1;
                tab.texture = None;
            }
            if previous && tab.page_index > 0 {
                tab.page_index -= 1;
                tab.texture = None;
            }
        }
    }
}

impl eframe::App for OpenPdfApp {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        self.handle_dropped_files(ctx);
        self.handle_shortcuts(ctx);
        self.top_bar(ctx);
        self.tabs_bar(ctx);
        if self.tabs.is_empty() {
            self.welcome(ctx);
        } else {
            self.pages_sidebar(ctx);
            self.tools_sidebar(ctx);
            self.viewer(ctx);
        }
        self.about_window(ctx);
    }
}

fn system_prefers_dark() -> bool {
    #[cfg(windows)]
    {
        use std::process::Command;
        if let Ok(output) = Command::new("reg")
            .args([
                "query",
                r"HKCU\Software\Microsoft\Windows\CurrentVersion\Themes\Personalize",
                "/v",
                "AppsUseLightTheme",
            ])
            .output()
        {
            let text = String::from_utf8_lossy(&output.stdout);
            return text.contains("0x0");
        }
    }
    false
}

fn screen_to_pdf(
    position: Pos2,
    rect: Rect,
    page_width: f32,
    page_height: f32,
    rotation: u16,
) -> (f32, f32) {
    let u = ((position.x - rect.left()) / rect.width()).clamp(0.0, 1.0);
    let v = ((position.y - rect.top()) / rect.height()).clamp(0.0, 1.0);
    match rotation {
        90 => (v * page_width, u * page_height),
        180 => ((1.0 - u) * page_width, v * page_height),
        270 => ((1.0 - v) * page_width, (1.0 - u) * page_height),
        _ => (u * page_width, (1.0 - v) * page_height),
    }
}
