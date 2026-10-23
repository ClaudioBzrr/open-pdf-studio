import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "en" | "pt";

const STORAGE_KEY = "openpdf.lang";

const en: Record<string, string> = {
  // Common / shell
  "OpenPDF Studio": "OpenPDF Studio",
  "Nenhum documento aberto": "No document open",
  "Abrir": "Open",
  "Baixar PDF": "Download PDF",
  "Alternar painel": "Toggle panel",
  "Alternar tema": "Toggle theme",
  "Tema: sistema": "Theme: system",
  "Tema: claro": "Theme: light",
  "Tema: escuro": "Theme: dark",
  "Desfazer": "Undo",
  "Refazer": "Redo",
  "Abrir PDF": "Open PDF",
  "Abrir PDF de exemplo": "Open sample PDF",
  "Criar PDF em branco": "Create blank PDF",
  "página": "page",
  "páginas": "pages",
  "protegido": "protected",
  "local": "local",
  "100% local": "100% local",
  "Visualizar": "View",
  "Anotar": "Annotate",
  "Páginas": "Pages",
  "Formulários": "Forms",
  "Editar": "Edit",
  "Proteger": "Protect",
  "OCR": "OCR",
  "Comparar": "Compare",
  "Privacidade": "Privacy",

  // Welcome
  "Workspace de PDF open-source": "Open-source PDF workspace",
  "Seus PDFs.": "Your PDFs.",
  "No seu navegador.": "In your browser.",
  "Leia, edite, assine, proteja, oculte e reconheça texto em PDFs sem criar conta e sem enviar arquivos para nenhum servidor. A privacidade não é uma opção: é a arquitetura.":
    "Read, edit, sign, protect, redact and OCR PDFs without creating an account or sending files to any server. Privacy is not an option: it is the architecture.",
  "Arraste um PDF aqui ou clique para abrir": "Drop a PDF here or click to open",
  "Processado no seu dispositivo · até vários arquivos para mesclar": "Processed on your device · multiple files can be merged",
  "Escolher PDF": "Choose PDF",
  "Sem upload.": "No upload.",
  "Sem conta. Sem telemetria. O código roda inteiramente no cliente.": "No account. No telemetry. The code runs entirely on the client.",
  "Leitor completo": "Complete reader",
  "Renderização nítida, zoom, rotação, miniaturas, sumário, busca e leitura em voz alta.":
    "Sharp rendering, zoom, rotation, thumbnails, outline, search and read-aloud.",
  "Anotar e editar": "Annotate and edit",
  "Marca-texto, comentários, desenho, formas, texto, imagens, assinatura visual e cobertura.":
    "Highlights, comments, drawing, shapes, text, images, visual signature and whiteout.",
  "Organizar páginas": "Organize pages",
  "Reordenar, excluir, duplicar, extrair, dividir, mesclar e girar páginas.":
    "Reorder, delete, duplicate, extract, split, merge and rotate pages.",
  "OCR local": "Local OCR",
  "Reconhecimento de texto em português e inglês com Tesseract.js, sem enviar o PDF.":
    "Portuguese and English OCR with Tesseract.js, without sending the PDF.",
  "Proteção AES-256": "AES-256 protection",
  "Senhas e permissões de impressão, cópia e edição aplicadas no próprio navegador.":
    "Passwords and print, copy and edit permissions applied in the browser.",
  "Privacidade por arquitetura": "Privacy by architecture",
  "Não existe servidor de documentos. O arquivo nunca sai do seu dispositivo.":
    "There is no document server. The file never leaves your device.",
  "Independência": "Independence",
  "Inspirado na superfície de recursos do Acrobat, não no seu código.":
    "Inspired by Acrobat's feature surface, not by its code.",
  "Este é um projeto independente, construído com bibliotecas open-source. Não é afiliado à Adobe e não contorna licenças, DRM ou recursos pagos. Recursos equivalentes são implementados com PDF.js, pdf-lib, Tesseract.js e APIs do navegador.":
    "This is an independent project built with open-source libraries. It is not affiliated with Adobe and does not bypass licenses, DRM or paid features. Equivalent features are implemented with PDF.js, pdf-lib, Tesseract.js and browser APIs.",

  // Viewer
  "Página anterior": "Previous page",
  "Próxima página": "Next page",
  "Número da página": "Page number",
  "Diminuir zoom": "Zoom out",
  "Aumentar zoom": "Zoom in",
  "Redefinir para 100%": "Reset to 100%",
  "Ajustar à largura": "Fit width",
  "Ajustar à página": "Fit page",
  "Girar 90° à esquerda": "Rotate 90° left",
  "Girar 90° à direita": "Rotate 90° right",
  "Buscar no documento (Ctrl+F)": "Search document (Ctrl+F)",
  "Parar leitura": "Stop reading",
  "Ler esta página em voz alta": "Read this page aloud",
  "Selecionar": "Select",
  "Marca-texto": "Highlighter",
  "Sublinhado": "Underline",
  "Tachado": "Strikethrough",
  "Comentário": "Comment",
  "Caneta": "Pen",
  "Retângulo": "Rectangle",
  "Seta": "Arrow",
  "Texto": "Text",
  "Redação": "Redaction",
  "Cobertura": "Whiteout",
  "Imagem": "Image",
  "Assinatura": "Signature",

  // Search
  "Buscar no documento": "Search document",
  "Fechar busca": "Close search",
  "Digite uma palavra ou frase…": "Type a word or phrase…",
  "Buscar": "Search",
  "Buscando…": "Searching…",
  "Nenhuma ocorrência encontrada.": "No matches found.",
  "ocorrência(s)": "match(es)",
  "Página {n}": "Page {n}",

  // Password
  "PDF protegido": "Protected PDF",
  "precisa de uma senha para abrir. Ela é usada apenas neste navegador.":
    "requires a password to open. It is used only in this browser.",
  "Senha do PDF": "PDF password",
  "Ocultar senha": "Hide password",
  "Mostrar senha": "Show password",
  "Cancelar": "Cancel",
  "Fechar": "Close",

  // View panel
  "Documento": "Document",
  "Navegue por miniaturas, sumário e propriedades.": "Browse thumbnails, outline and properties.",
  "Páginas ({n})": "Pages ({n})",
  "Girar página atual": "Rotate current page",
  "Sumário": "Outline",
  "Este PDF não possui marcadores.": "This PDF has no bookmarks.",
  "Propriedades": "Properties",
  "Título": "Title",
  "Autor": "Author",
  "Assunto": "Subject",
  "Palavras-chave": "Keywords",
  "Criador": "Creator",
  "Produtor": "Producer",
  "Criado em": "Created",
  "Metadados": "Metadata",
  "Não informados": "Not provided",
  "Atalhos": "Shortcuts",
  "Navegar entre páginas": "Navigate pages",
  "Baixar PDF editado": "Download edited PDF",
  "Desfazer anotação": "Undo annotation",
  "Excluir anotação selecionada": "Delete selected annotation",
  "Renderização por PDF.js. O arquivo é lido diretamente da memória do navegador.":
    "Rendered by PDF.js. The file is read directly from browser memory.",

  // Annotate panel
  "Marcações": "Markup",
  "Escolha uma ferramenta e arraste sobre a página.": "Choose a tool and drag over the page.",
  "Ferramentas": "Tools",
  "Aparência": "Appearance",
  "Cor": "Color",
  "Opacidade · {n}%": "Opacity · {n}%",
  "Espessura · {n} pt": "Thickness · {n} pt",
  "Tamanho do texto · {n} pt": "Text size · {n} pt",
  "Selecionado": "Selected",
  "Conteúdo": "Content",
  "Anotações ({n})": "Annotations ({n})",
  "Nenhuma anotação ainda.": "No annotations yet.",
  "Limpar todas": "Clear all",
  "Baixar PDF com anotações": "Download PDF with annotations",
  "Exportar JSON": "Export JSON",
  "As anotações são achatadas no PDF exportado. O arquivo original não é modificado.":
    "Annotations are flattened into the exported PDF. The original file is not modified.",
  "Sem texto": "No text",
  "Área marcada para remoção": "Area marked for removal",
  "Assinatura visual": "Visual signature",

  // Pages panel
  "Organização": "Organization",
  "Arraste para reordenar. Marque páginas para ações em lote.":
    "Drag to reorder. Select pages for batch actions.",
  "Seleção ({n})": "Selection ({n})",
  "nenhuma": "none",
  "Selecionar todas": "Select all",
  "Girar": "Rotate",
  "Duplicar": "Duplicate",
  "Excluir": "Delete",
  "Extrair": "Extract",
  "Mesclar": "Merge",
  "Dividir documento": "Split document",
  "Dividir após a página": "Split after page",
  "Dividir em dois PDFs": "Split into two PDFs",
  "Ordem das páginas": "Page order",
  "Selecionar página": "Select page",
  "Arraste para reordenar": "Drag to reorder",

  // Forms
  "AcroForm": "AcroForm",
  "Preencha campos e baixe uma cópia com os valores aplicados.":
    "Fill fields and download a copy with the values applied.",
  "Lendo campos do PDF…": "Reading PDF fields…",
  "Nenhum formulário AcroForm": "No AcroForm form",
  "Este PDF não contém campos interativos, ou usa XFA (não suportado).":
    "This PDF has no interactive fields, or uses XFA (unsupported).",
  "Campos ({n})": "Fields ({n})",
  "Exportar": "Export",
  "Achatar campos ao salvar": "Flatten fields on save",
  "Baixar preenchido": "Download filled",
  "Salvando…": "Saving…",
  "A aparência dos campos é atualizada antes de salvar. XFA não é suportado.":
    "Field appearances are updated before saving. XFA is not supported.",
  " O arquivo de saída não manterá a senha atual; reaplique a proteção depois.":
    " The output file will not keep the current password; reapply protection afterwards.",

  // Edit panel
  "Sobreposição, assinatura, redação segura e compressão.":
    "Overlay, signature, secure redaction and compression.",
  "Redigir": "Redact",
  "Comprimir": "Compress",
  "Adicionar à página": "Add to page",
  "Cobrir": "Whiteout",
  "Imagem pronta para inserir": "Image ready to insert",
  "Remover": "Remove",
  "Clique na página para posicionar.": "Click the page to place it.",
  "Estilo do texto": "Text style",
  "Tamanho · {n} pt": "Size · {n} pt",
  "Desenhar": "Draw",
  "Digitar": "Type",
  "Nome da assinatura": "Signature name",
  "Seu nome": "Your name",
  "Usar assinatura": "Use signature",
  "Prévia da assinatura": "Signature preview",
  "Assinatura visual (imagem). Não é uma assinatura digital certificada. Para validade jurídica com certificado, use um provedor ICP-Brasil.":
    "Visual signature (image). It is not a certified digital signature. For legal validity with a certificate, use an ICP-Brasil provider.",
  "A edição é feita por sobreposição, como uma camada. Ela não reflui o texto original — para remover conteúdo de verdade, use a aba Redigir.":
    "Editing is an overlay layer. It does not reflow the original text — to truly remove content, use the Redact tab.",
  "Redação irreversível": "Irreversible redaction",
  "Remoção real, não apenas um retângulo preto.": "Real removal, not just a black rectangle.",
  "As páginas marcadas são rasterizadas e o conteúdo sob as áreas é descartado. O texto deixa de ser pesquisável nessas páginas.":
    "Marked pages are rasterized and content under the areas is discarded. Text is no longer searchable on those pages.",
  "Marcar área de redação": "Mark redaction area",
  "Marcando áreas…": "Marking areas…",
  "{n} área(s) marcada(s). Arraste retângulos sobre a página.":
    "{n} area(s) marked. Drag rectangles over the page.",
  "Limpar marcações": "Clear marks",
  "Qualidade da rasterização": "Rasterization quality",
  "DPI": "DPI",
  "150 DPI · menor arquivo": "150 DPI · smaller file",
  "200 DPI · equilíbrio": "200 DPI · balanced",
  "300 DPI · alta qualidade": "300 DPI · high quality",
  "Remover metadados": "Remove metadata",
  "Título, autor, assunto e palavras-chave.": "Title, author, subject and keywords.",
  "Aplicar redação e baixar": "Apply redaction and download",
  "Compressão por rasterização": "Rasterization compression",
  "Recomendado para PDFs escaneados ou com muitas imagens. O texto deixa de ser vetorial/pesquisável no resultado.":
    "Recommended for scanned or image-heavy PDFs. Text is no longer vector/searchable in the result.",
  "Resolução": "Resolution",
  "100 DPI · máximo": "100 DPI · maximum",
  "150 DPI · recomendado": "150 DPI · recommended",
  "200 DPI · qualidade": "200 DPI · quality",
  "Qualidade JPEG · {n}%": "JPEG quality · {n}%",
  "Comprimir e baixar": "Compress and download",
  "Sem servidor.": "No server.",
  "A compressão acontece no navegador. Para PDFs vetoriais, o resultado pode ficar maior.":
    "Compression happens in the browser. For vector PDFs, the result may be larger.",

  // Protect
  "Segurança": "Security",
  "Criptografia AES-256 e permissões aplicadas localmente.":
    "AES-256 encryption and permissions applied locally.",
  "AES-256 no navegador.": "AES-256 in the browser.",
  "As senhas não são transmitidas nem armazenadas. O PDF é criptografado em memória.":
    "Passwords are not transmitted or stored. The PDF is encrypted in memory.",
  "Proteger com senha": "Protect with password",
  "Senha de abertura": "Open password",
  "Necessária para abrir o PDF.": "Required to open the PDF.",
  "Confirmar senha": "Confirm password",
  "Senha de proprietário": "Owner password",
  "Opcional. Permite alterar permissões.": "Optional. Allows changing permissions.",
  "Impressão": "Printing",
  "Permitida em alta qualidade": "Allowed in high quality",
  "Somente baixa resolução": "Low resolution only",
  "Bloqueada": "Blocked",
  "Copiar texto e gráficos": "Copy text and graphics",
  "Modificar conteúdo": "Modify content",
  "Adicionar anotações": "Add annotations",
  "Preencher formulários": "Fill forms",
  "Montar documento": "Assemble document",
  "Acessibilidade": "Accessibility",
  "Proteger e baixar": "Protect and download",
  "Protegendo…": "Protecting…",
  "Remover senha": "Remove password",
  "Senha atual": "Current password",
  "Para PDFs que você já consegue abrir.": "For PDFs you can already open.",
  "Descriptografar e baixar": "Decrypt and download",
  "Permissões são aplicadas ao PDF, mas alguns visualizadores podem ignorá-las. A senha de abertura é a proteção principal.":
    "Permissions are applied to the PDF, but some viewers may ignore them. The open password is the main protection.",

  // OCR
  "Reconhecimento": "Recognition",
  "Texto de PDFs escaneados, processado no navegador.":
    "Text from scanned PDFs, processed in the browser.",
  "Tesseract.js local.": "Local Tesseract.js.",
  "Os modelos de português e inglês estão incluídos no app. Nenhuma página é enviada para a nuvem.":
    "Portuguese and English models are included in the app. No page is sent to the cloud.",
  "Configuração": "Settings",
  "Idioma": "Language",
  "Português": "Portuguese",
  "Inglês": "English",
  "Português + inglês": "Portuguese + English",
  "Página atual ({n})": "Current page ({n})",
  "Todas as {n} páginas": "All {n} pages",
  "Executar OCR": "Run OCR",
  "Reconhecendo…": "Recognizing…",
  "Texto reconhecido": "Recognized text",
  "Copiar": "Copy",
  "Baixar .txt": "Download .txt",
  "Ler em voz alta": "Read aloud",
  "Baixar PDF pesquisável": "Download searchable PDF",
  "O PDF pesquisável mantém a imagem original e adiciona uma camada de texto invisível, permitindo busca e seleção. A precisão depende do OCR.":
    "The searchable PDF keeps the original image and adds an invisible text layer for search and selection. Accuracy depends on OCR.",
  "Dica: para PDFs digitalizados, use 200–300 DPI no momento da digitalização. O OCR pode falhar em manuscritos e layouts complexos.":
    "Tip: for scanned PDFs, use 200–300 DPI when scanning. OCR may fail on handwriting and complex layouts.",

  // Compare
  "Revisão": "Review",
  "Veja diferenças visuais entre duas versões, sem servidor.":
    "See visual differences between two versions, without a server.",
  "Segundo documento": "Second document",
  "Original": "Original",
  "Comparar com": "Compare with",
  "Nenhum arquivo selecionado": "No file selected",
  "Escolher segundo PDF": "Choose second PDF",
  "Processando…": "Processing…",
  "Resumo": "Summary",
  "similaridade média": "average similarity",
  "pixels diferentes": "different pixels",
  "páginas comparadas": "pages compared",
  "Comparação visual de até 30 páginas. Pequenas diferenças de renderização podem gerar ruído.":
    "Visual comparison of up to 30 pages. Small rendering differences may add noise.",
  "% similar": "% similar",
  "Diferenças": "Differences",
  "Comparado": "Compared",

  // Privacy
  "Confiança": "Trust",
  "A arquitetura é a política: não existe backend de documentos.":
    "The architecture is the policy: there is no document backend.",
  "Seu PDF não sai do navegador.": "Your PDF never leaves the browser.",
  "Leitura, edição, OCR, criptografia e comparação acontecem na memória do dispositivo.":
    "Reading, editing, OCR, encryption and comparison happen in device memory.",
  "Garantias": "Guarantees",
  "Nenhum upload para servidor de documentos.": "No upload to a document server.",
  "Sem conta, sem login, sem telemetria e sem analytics.": "No account, login, telemetry or analytics.",
  "Processamento local com WebAssembly e APIs do navegador.": "Local processing with WebAssembly and browser APIs.",
  "Funciona offline depois do primeiro carregamento.": "Works offline after first load.",
  "Senhas e chaves existem apenas em memória.": "Passwords and keys exist only in memory.",
  "Código-fonte aberto e auditável.": "Open and auditable source code.",
  "Como verificar": "How to verify",
  "Abra as Ferramentas de Desenvolvedor do navegador (F12).": "Open the browser Developer Tools (F12).",
  "Vá até a aba Network e abra um PDF.": "Go to the Network tab and open a PDF.",
  "Observe que nenhuma requisição contém o conteúdo do arquivo.": "Notice that no request contains the file contents.",
  "Ative o modo offline e continue lendo/editando o documento já aberto.":
    "Enable offline mode and keep reading/editing the open document.",
  "O app é estático. Para uso institucional, publique os arquivos de build em qualquer host estático ou rode localmente com":
    "The app is static. For institutional use, publish the build files on any static host or run locally with",
  "Armazenamento": "Storage",
  "O documento fica apenas na memória da aba. Ao recarregar ou fechar, ele é descartado. Apenas preferências de interface (zoom, tema) podem ser gravadas no":
    "The document stays only in tab memory. It is discarded on reload or close. Only UI preferences (zoom, theme) may be stored in",
  "Limites honestos": "Honest limits",
  "Não remove DRM, não contorna licenças e não abre PDFs com restrições de terceiros.":
    "Does not remove DRM, bypass licenses or open PDFs with third-party restrictions.",
  "Assinatura visual não substitui assinatura digital certificada (ICP-Brasil/PAdES).":
    "Visual signature does not replace a certified digital signature (ICP-Brasil/PAdES).",
  "Edição de texto é por sobreposição; não há reflow completo do conteúdo original.":
    "Text editing is an overlay; there is no full reflow of the original content.",
  "Formulários XFA, 3D, multimídia avançada e PDF/A não são suportados.":
    "XFA forms, 3D, advanced multimedia and PDF/A are not supported.",
  "OCR é local, mas manuscritos e layouts complexos podem falhar.":
    "OCR is local, but handwriting and complex layouts may fail.",
  "OpenPDF Studio é um projeto independente, sem afiliação com a Adobe. A superfície de recursos foi inspirada em leitores/editores de PDF modernos; nenhum código proprietário do Acrobat foi copiado, extraído ou reutilizado.":
    "OpenPDF Studio is an independent project, not affiliated with Adobe. The feature surface was inspired by modern PDF readers/editors; no proprietary Acrobat code was copied, extracted or reused.",
  "Bibliotecas: PDF.js (Apache-2.0), pdf-lib/@cantoo (MIT), Tesseract.js (Apache-2.0), React (MIT), Vite (MIT), JSZip (MIT), idb (ISC).":
    "Libraries: PDF.js (Apache-2.0), pdf-lib/@cantoo (MIT), Tesseract.js (Apache-2.0), React (MIT), Vite (MIT), JSZip (MIT), idb (ISC).",

  // Toasts / errors
  "PDF aberto localmente.": "PDF opened locally.",
  "Senha incorreta. Tente novamente.": "Incorrect password. Try again.",
  "Não foi possível abrir o PDF. Verifique se o arquivo é válido.":
    "Could not open the PDF. Check that the file is valid.",
  "Selecione um arquivo PDF.": "Select a PDF file.",
  "Não foi possível abrir/mesclar os arquivos. PDFs protegidos devem ser abertos individualmente.":
    "Could not open/merge files. Protected PDFs must be opened individually.",
  "O PDF de exemplo não está disponível. Gere-o com npm run sample.":
    "The sample PDF is unavailable. Generate it with npm run sample.",
  "Não foi possível criar o PDF em branco.": "Could not create the blank PDF.",
  "PDF baixado. O arquivo original permanece intacto.":
    "PDF downloaded. The original file remains intact.",
  "Não foi possível gerar o PDF.": "Could not generate the PDF.",
  "Remover todas as anotações deste documento?": "Remove all annotations from this document?",
  "Reordenando páginas…": "Reordering pages…",
  "Páginas reordenadas.": "Pages reordered.",
  "Não foi possível reordenar as páginas.": "Could not reorder pages.",
  "O documento precisa manter pelo menos uma página.": "The document must keep at least one page.",
  "Excluir {n} página(s)? As anotações serão achatadas antes.":
    "Delete {n} page(s)? Annotations will be flattened first.",
  "Excluindo páginas…": "Deleting pages…",
  "Páginas excluídas.": "Pages deleted.",
  "Não foi possível excluir as páginas.": "Could not delete pages.",
  "Duplicando páginas…": "Duplicating pages…",
  "Páginas duplicadas.": "Pages duplicated.",
  "Não foi possível duplicar as páginas.": "Could not duplicate pages.",
  "Extraindo páginas…": "Extracting pages…",
  "Páginas extraídas ({n}).": "Pages extracted ({n}).",
  "Não foi possível extrair as páginas.": "Could not extract pages.",
  "Selecione pelo menos um PDF.": "Select at least one PDF.",
  "Mesclando PDFs…": "Merging PDFs…",
  "PDFs mesclados.": "PDFs merged.",
  "Não foi possível mesclar. Verifique se os PDFs não estão protegidos.":
    "Could not merge. Check that the PDFs are not protected.",
  "Dividindo documento…": "Splitting document…",
  "Documento dividido em dois PDFs.": "Document split into two PDFs.",
  "Preparando redação…": "Preparing redaction…",
  "Redação aplicada. O PDF redigido foi baixado.": "Redaction applied. The redacted PDF was downloaded.",
  "Comprimindo PDF…": "Compressing PDF…",
  "PDF comprimido: {from} → {to}{delta}.": "PDF compressed: {from} → {to}{delta}.",
  "Não foi possível comprimir o PDF.": "Could not compress the PDF.",
  "Anotações exportadas em JSON.": "Annotations exported as JSON.",
  "Falha na busca.": "Search failed.",
  "Esta página não tem texto extraível. Use o OCR.": "This page has no extractable text. Use OCR.",
  "Não foi possível iniciar a leitura.": "Could not start reading.",
  "Não foi possível acessar a área de transferência.": "Could not access the clipboard.",
  "A senha deve ter pelo menos 4 caracteres.": "The password must be at least 4 characters.",
  "As senhas não coincidem.": "Passwords do not match.",
  "Use uma senha de abertura com pelo menos 4 caracteres.": "Use an open password with at least 4 characters.",
  "As senhas de abertura não coincidem.": "Open passwords do not match.",
  "PDF protegido com AES-256 e baixado.": "PDF protected with AES-256 and downloaded.",
  "PDF descriptografado e baixado.": "PDF decrypted and downloaded.",
  "Não foi possível descriptografar. Verifique a senha.":
    "Could not decrypt. Check the password.",
  "OCR concluído. O texto está disponível abaixo.": "OCR complete. The text is available below.",
  "Falha no OCR. Verifique se os arquivos de idioma estão em /tessdata e recarregue a página.":
    "OCR failed. Check that the language files are in /tessdata and reload the page.",
  "Texto copiado.": "Text copied.",
  "PDF pesquisável gerado com camada de texto invisível.":
    "Searchable PDF generated with an invisible text layer.",
  "Não foi possível abrir o segundo PDF. Ele pode estar protegido por senha.":
    "Could not open the second PDF. It may be password-protected.",
  "Comparação concluída.": "Comparison complete.",
  "Falha ao comparar os documentos.": "Failed to compare documents.",
  "Este PDF foi aberto com senha. O arquivo baixado será desbloqueado (sem a proteção atual). Para manter a proteção, use a aba Proteger. Continuar?":
    "This PDF was opened with a password. The downloaded file will be unlocked (without the current protection). To keep protection, use the Protect tab. Continue?",
  "Processando no seu dispositivo…": "Processing on your device…",
  "Abrindo PDF…": "Opening PDF…",
  "Lendo estrutura e metadados…": "Reading structure and metadata…",
  "Mesclando arquivos…": "Merging files…",
  "Aplicando anotações e rotações…": "Applying annotations and rotations…",
  "Recursos": "Features",
  "Clique para editar": "Click to edit",
  "copia": "copy",
  "editado": "edited",
  "Formulário preenchido e achatado.": "Form filled and flattened.",
  "Formulário preenchido e baixado.": "Form filled and downloaded.",
  "Inicializando OCR…": "Initializing OCR…",
  "Preparando comparação…": "Preparing comparison…",
  "similar": "similar",
  "Carregando página…": "Loading page…",
  "Renderizando…": "Rendering…",
  "Área para desenhar a assinatura": "Area to draw the signature",
  "Limpar": "Clear",
  "Fechar aviso": "Dismiss notification",
  "Cor personalizada": "Custom color",
};

const dictionaries: Record<Lang, Record<string, string>> = { en, pt: {} };

const readStoredLang = (): Lang | null => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "en" || value === "pt" ? value : null;
  } catch {
    return null;
  }
};

export const detectLang = (): Lang => {
  const stored = readStoredLang();
  if (stored) return stored;
  if (typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("pt")) return "pt";
  return "en";
};

const interpolate = (text: string, vars?: Record<string, string | number>): string => {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? `{${key}}`));
};

export const translate = (lang: Lang, text: string, vars?: Record<string, string | number>): string => {
  const resolved = lang === "en" ? dictionaries.en[text] ?? text : text;
  return interpolate(resolved, vars);
};

interface I18nValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: (text: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(detectLang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore storage failures.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === "pt" ? "pt-BR" : "en";
  }, [lang]);

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      setLang,
      toggleLang: () => setLang(lang === "en" ? "pt" : "en"),
      t: (text, vars) => translate(lang, text, vars),
    }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nValue => {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider.");
  return value;
};
