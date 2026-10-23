#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Lang {
    En,
    Pt,
}

impl Lang {
    pub fn detect() -> Self {
        if let Ok(locale) = std::env::var("OPENPDF_LANG") {
            let locale = locale.to_lowercase();
            if locale.starts_with("pt") {
                return Lang::Pt;
            }
            if locale.starts_with("en") {
                return Lang::En;
            }
        }
        if sys_locale::get_locale()
            .map(|locale| locale.to_lowercase().starts_with("pt"))
            .unwrap_or(false)
        {
            Lang::Pt
        } else {
            Lang::En
        }
    }

    pub fn toggle(self) -> Self {
        match self {
            Lang::En => Lang::Pt,
            Lang::Pt => Lang::En,
        }
    }

    pub fn label(self) -> &'static str {
        match self {
            Lang::En => "EN",
            Lang::Pt => "PT",
        }
    }

    pub fn t(self, english: &'static str) -> &'static str {
        if self == Lang::En {
            return english;
        }
        match english {
            "Open PDF" => "Abrir PDF",
            "Open a PDF" => "Abrir um PDF",
            "Save" => "Salvar",
            "Save as" => "Salvar como",
            "Search" => "Buscar",
            "Search in document" => "Buscar no documento",
            "No matches" => "Nenhuma ocorrência",
            "Pages" => "Páginas",
            "Page" => "Página",
            "of" => "de",
            "Annotate" => "Anotar",
            "Select" => "Selecionar",
            "Rectangle" => "Retângulo",
            "Text note" => "Nota de texto",
            "Note text" => "Texto da nota",
            "Click the page to place the note" => "Clique na página para posicionar a nota",
            "Copy page text" => "Copiar texto da página",
            "Page text" => "Texto da página",
            "No text on this page" => "Sem texto nesta página",
            "Zoom" => "Zoom",
            "Previous page" => "Página anterior",
            "Next page" => "Próxima página",
            "Color" => "Cor",
            "Copied" => "Copiado",
            "Fit width" => "Ajustar à largura",
            "Fit page" => "Ajustar à página",
            "Rotate view" => "Girar visualização",
            "Theme" => "Tema",
            "Language" => "Idioma",
            "About" => "Sobre",
            "No document open" => "Nenhum documento aberto",
            "Open a PDF to begin" => "Abra um PDF para começar",
            "Your PDFs. On your desktop." => "Seus PDFs. No seu desktop.",
            "A native Rust PDF workspace with local rendering, annotations, search and page tools. No upload, no account." =>
                "Um workspace de PDF nativo em Rust com renderização local, anotações, busca e ferramentas de página. Sem upload, sem conta.",
            "Drop a PDF here" => "Arraste um PDF aqui",
            "or choose a file" => "ou escolha um arquivo",
            "Recent files" => "Arquivos recentes",
            "No recent files" => "Nenhum arquivo recente",
            "Tools" => "Ferramentas",
            "Viewer" => "Visualizador",
            "Annotate PDFs" => "Anotar PDFs",
            "Search text" => "Buscar texto",
            "Page tools" => "Ferramentas de página",
            "Save changes" => "Salvar alterações",
            "Open a PDF to use this tool" => "Abra um PDF para usar esta ferramenta",
            "Ready" => "Pronto",
            "Unsaved changes" => "Alterações não salvas",
            "Saved" => "Salvo",
            "Error" => "Erro",
            "Close tab" => "Fechar aba",
            "Delete page" => "Excluir página",
            "Delete the current page?" => "Excluir a página atual?",
            "Page deleted" => "Página excluída",
            "Cannot delete the only page" => "Não é possível excluir a única página",
            "Extract current page" => "Extrair página atual",
            "Page extracted" => "Página extraída",
            "Merge PDF" => "Mesclar PDF",
            "Merged" => "Mesclado",
            "Rotate page" => "Girar página",
            "Page rotation saved" => "Rotação da página salva",
            "PDF files" => "Arquivos PDF",
            "All files" => "Todos os arquivos",
            "Open failed" => "Falha ao abrir",
            "Save failed" => "Falha ao salvar",
            "pdfium.dll not found" => "pdfium.dll não encontrado",
            "Native PDF viewer powered by PDFium" => "Visualizador PDF nativo com PDFium",
            "Local-first. No upload." => "Local-first. Sem upload.",
            "Roadmap: OCR, AES-256, redaction, compression, comparison and certified signatures." =>
                "Roadmap: OCR, AES-256, redação, compressão, comparação e assinaturas certificadas.",
            "Document" => "Documento",
            "File" => "Arquivo",
            "Path" => "Caminho",
            "Metadata" => "Metadados",
            "Title" => "Título",
            "Author" => "Autor",
            "Subject" => "Assunto",
            "Keywords" => "Palavras-chave",
            "Unknown" => "Desconhecido",
            "Close" => "Fechar",
            "Native viewer" => "Visualizador nativo",
            "This build focuses on a fast native viewer with annotations, search, page rotation and page extraction. OCR, protection, redaction, compression, comparison and certified signatures remain on the roadmap." =>
                "Esta build foca em um visualizador nativo rápido com anotações, busca, rotação e extração de páginas. OCR, proteção, redação, compressão, comparação e assinaturas certificadas continuam no roadmap.",
            _ => english,
        }
    }
}
