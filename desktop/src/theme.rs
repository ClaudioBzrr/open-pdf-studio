use eframe::egui::{
    self, Color32, FontData, FontDefinitions, FontFamily, FontId, Stroke, TextStyle, Visuals,
};

#[derive(Clone, Copy)]
pub struct Palette {
    pub bg: Color32,
    pub surface: Color32,
    pub surface_soft: Color32,
    pub border: Color32,
    pub text: Color32,
    pub muted: Color32,
    pub primary: Color32,
    pub primary_soft: Color32,
    pub accent: Color32,
}

impl Palette {
    pub const fn light() -> Self {
        Self {
            bg: Color32::from_rgb(255, 251, 248),
            surface: Color32::from_rgb(255, 255, 255),
            surface_soft: Color32::from_rgb(243, 247, 244),
            border: Color32::from_rgb(221, 229, 223),
            text: Color32::from_rgb(27, 28, 26),
            muted: Color32::from_rgb(65, 73, 68),
            primary: Color32::from_rgb(11, 110, 79),
            primary_soft: Color32::from_rgb(184, 240, 214),
            accent: Color32::from_rgb(255, 122, 69),
        }
    }

    pub const fn dark() -> Self {
        Self {
            bg: Color32::from_rgb(16, 20, 18),
            surface: Color32::from_rgb(23, 29, 25),
            surface_soft: Color32::from_rgb(29, 36, 32),
            border: Color32::from_rgb(65, 73, 68),
            text: Color32::from_rgb(225, 227, 223),
            muted: Color32::from_rgb(192, 201, 194),
            primary: Color32::from_rgb(125, 219, 175),
            primary_soft: Color32::from_rgb(0, 82, 54),
            accent: Color32::from_rgb(255, 181, 154),
        }
    }
}

pub fn configure_fonts(ctx: &egui::Context) {
    let mut fonts = FontDefinitions::default();
    fonts.font_data.insert(
        "plex".to_owned(),
        FontData::from_static(include_bytes!("../assets/IBMPlexSans-Regular.ttf")).into(),
    );
    fonts.font_data.insert(
        "plex-semibold".to_owned(),
        FontData::from_static(include_bytes!("../assets/IBMPlexSans-SemiBold.ttf")).into(),
    );
    if let Some(family) = fonts.families.get_mut(&FontFamily::Proportional) {
        family.insert(0, "plex".to_owned());
        family.insert(1, "plex-semibold".to_owned());
    }
    ctx.set_fonts(fonts);
    ctx.style_mut(|style| {
        style.text_styles = [
            (TextStyle::Heading, FontId::new(24.0, FontFamily::Proportional)),
            (TextStyle::Body, FontId::new(13.0, FontFamily::Proportional)),
            (TextStyle::Button, FontId::new(12.5, FontFamily::Proportional)),
            (TextStyle::Small, FontId::new(10.5, FontFamily::Proportional)),
            (TextStyle::Monospace, FontId::new(11.0, FontFamily::Monospace)),
        ]
        .into();
    });
}

pub fn apply(ctx: &egui::Context, dark: bool) -> Palette {
    let palette = if dark { Palette::dark() } else { Palette::light() };
    let mut visuals = if dark { Visuals::dark() } else { Visuals::light() };
    visuals.panel_fill = palette.bg;
    visuals.window_fill = palette.surface;
    visuals.faint_bg_color = palette.surface_soft;
    visuals.extreme_bg_color = palette.surface_soft;
    visuals.override_text_color = Some(palette.text);
    visuals.selection.bg_fill = palette.primary;
    visuals.selection.stroke = Stroke::new(1.0_f32, palette.surface);
    visuals.widgets.noninteractive.bg_fill = palette.surface;
    visuals.widgets.noninteractive.bg_stroke = Stroke::new(1.0_f32, palette.border);
    visuals.widgets.inactive.bg_fill = palette.surface_soft;
    visuals.widgets.inactive.bg_stroke = Stroke::new(1.0_f32, palette.border);
    visuals.widgets.hovered.bg_fill = palette.primary_soft;
    visuals.widgets.hovered.bg_stroke = Stroke::new(1.0_f32, palette.primary);
    visuals.widgets.active.bg_fill = palette.primary;
    visuals.widgets.active.bg_stroke = Stroke::new(1.0_f32, palette.primary);
    visuals.widgets.open.bg_fill = palette.surface_soft;
    visuals.window_corner_radius = egui::CornerRadius::same(14);
    visuals.menu_corner_radius = egui::CornerRadius::same(10);
    ctx.set_visuals(visuals);
    palette
}

pub fn window_icon() -> Option<egui::IconData> {
    let image = image::load_from_memory(include_bytes!("../assets/icon.png")).ok()?.to_rgba8();
    let (width, height) = image.dimensions();
    Some(egui::IconData {
        rgba: image.into_raw(),
        width,
        height,
    })
}
