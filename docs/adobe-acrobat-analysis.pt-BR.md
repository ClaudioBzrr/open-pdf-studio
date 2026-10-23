# Análise funcional do Adobe Acrobat instalado (com REA)

> Documento de engenharia. Não contém código proprietário, chaves, segredos ou instruções de contorno de licença.

## 1. Alvo e método

| Item | Observação |
|---|---|
| Produto instalado | **Adobe Acrobat 26.2.21931.0** (o usuário citou "Reader DC"; o binário instalado é o Acrobat completo) |
| Caminho | `C:\Program Files\Adobe\Acrobat DC\Acrobat\Acrobat.exe` |
| Formato | PE32+ x86-64 |
| SHA-256 | `b4b6e679c69679091ca70fdfe847850943b729c1a5b21e179bc080a538454621` |
| Recursos PE | 49 recursos, 63 data directories, 2 grupos de ícones |
| Plug-ins observados | `AcroForm`, `Annots`, `DigSig`, `PPKLite`, `EScript`, `Search`, `Accessibility`, `ReadOutLoud`, `reflow`, `TouchUp`, `Checkers`, `Multimedia`, `SaveAsRTF`, `SendMail`, `Spelling`, `Weblink`, `StorageConnectors`, `MSRMS`, `Updater` |

### O que o REA fez

- Abriu o executável com `open_binary` (somente leitura).
- Produziu inventário de artefato e recursos PE (`inspect_artifact`, `inspect_pe_resources`).
- Confirmou que **não havia Ghidra/IDA/Hopper** configurado neste host; portanto, não houve decompilação nativa.
- A análise ficou no nível de **identidade, inventário de componentes e superfície de plug-ins**. Isso é suficiente para mapear capacidades, mas não para copiar algoritmos proprietários.

### O que o REA não fez

- Não executou o Acrobat.
- Não extraiu código-fonte, chaves ou bancos de dados internos.
- Não burlou assinatura, ativação, DRM ou permissões pagas.
- Não tentou reproduzir o motor de renderização ou os serviços do Document Cloud.

## 2. Como o Acrobat se organiza

A arquitetura observada (e publicamente documentada) combina:

1. **Núcleo PDF** — parser de objetos COS, tabela xref/object streams, filtros (Flate, LZW, JPEG, JBIG2 etc.), fontes, espaços de cor, content streams e modelo gráfico.
2. **Renderizador** — interpreta operadores de desenho, texto, imagens, transparência, camadas e anotações.
3. **Plug-ins de aplicação** — cada `.api` estende o núcleo:
   - `AcroForm` — formulários interativos.
   - `Annots` — anotações e marcações.
   - `DigSig`/`PPKLite` — assinaturas digitais e PKI.
   - `EScript` — JavaScript de documento.
   - `Search` — indexação e busca.
   - `Accessibility`/`ReadOutLoud`/`reflow` — acessibilidade e reflow.
   - `TouchUp` — edição de objetos/conteúdo.
   - `Checkers` — pré-voo/verificações de produção.
   - `Multimedia`/`Weblink` — mídia e links.
   - `StorageConnectors`/`DropboxStorage` — armazenamento e nuvem.
   - `MSRMS` — Microsoft Rights Management.
   - `Updater` — atualização.
4. **Camada de licenciamento/serviços** — recursos "pagos" do Acrobat dependem de assinatura, ativação e, em alguns casos, serviços online. O aplicativo verifica entitlements; não é apenas uma flag local.
5. **Sandbox/proteção** — o Reader/Acrobat moderno usa processos protegidos, validação e mitigação de exploits. PDFs são entrada não confiável.

## 3. Mapa de equivalências implementadas no OpenPDF Studio

| Capacidade do Acrobat | Equivalente no OpenPDF | Estado |
|---|---|---|
| Renderização e navegação | PDF.js, canvas, zoom, rotação, miniaturas | Implementado |
| Busca textual | `getTextContent` + índice por página + destaque | Implementado |
| Seleção/cópia de texto | TextLayer do PDF.js | Implementado |
| Anotações | SVG overlay + achatamento com pdf-lib | Implementado |
| Formulários AcroForm | pdf-lib form API + aparências + flatten | Implementado |
| Organizar páginas | pdf-lib copyPages/merge/split | Implementado |
| Edição de texto | sobreposição de texto/imagem/cobertura | Parcial (sem reflow) |
| OCR | Tesseract.js local + PDF pesquisável | Implementado |
| Redação | rasterização irreversível + remoção de metadados | Implementado |
| Compressão | rasterização com DPI/qualidade | Implementado |
| Comparação | diff visual por página | Implementado |
| Proteção | AES-256 + permissões | Implementado |
| Assinatura | assinatura visual (imagem) | Parcial (não certificada) |
| Assinatura digital/PAdES | — | Não implementado |
| PDF/A, Preflight, cores | — | Não implementado |
| XFA, 3D, multimídia, JS de documento | — | Não suportado |
| Document Cloud/armazenamento | — | Não implementado (por design) |
| DRM/RMS | — | Não implementado e não contornado |

## 4. Limites e riscos

- **Paridade 1:1 não é viável** sem o motor proprietário, fontes, serviços e licenças da Adobe.
- **Recursos pagos** foram tratados como *equivalências funcionais open-source*, não como desbloqueio dos recursos da Adobe.
- **Assinatura visual** não tem validade criptográfica. Para ICP-Brasil/PAdES, integre um provedor certificado.
- **Redação** é segura apenas porque rasteriza a página; um retângulo preto sobre conteúdo vetorial não remove o texto.
- **OCR** é local, mas não tem a precisão de um produto comercial em manuscritos/layouts complexos.
- **PDFs maliciosos** continuam sendo entrada não confiável; mantenha PDF.js, navegador e dependências atualizados.

## 5. Conclusão

O Acrobat é um aplicativo nativo com núcleo PDF, renderizador, plug-ins e uma camada de licenciamento/serviços. O OpenPDF Studio reimplementa de forma independente o subconjunto que pode ser entregue com bibliotecas abertas e APIs do navegador, preservando a privacidade por arquitetura. O que não pode ser reproduzido de forma legítima — DRM, serviços pagos, codecs/fontes proprietárias e assinatura certificada da Adobe — permanece explicitamente fora do escopo.
