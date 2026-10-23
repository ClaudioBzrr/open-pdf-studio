import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PDFDocument, StandardFonts, rgb } from "@cantoo/pdf-lib";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { applyTheme, readThemeMode, watchSystemTheme, type ThemeMode } from "./theme";
import { useI18n } from "./i18n";
import {
  getMetadata,
  getOutline,
  getPageText,
  loadPdfJs,
  PasswordRequiredError,
  searchDocument,
  findSearchBoxes,
  type SearchHit,
} from "./lib/pdf";
import {
  buildPdfWithAnnotations,
} from "./lib/annotations";
import {
  deletePages,
  duplicatePages,
  extractPages,
  mergePdfs,
  reorderPages,
  splitAtPage,
} from "./lib/pages";
import { applyRedactions } from "./lib/redact";
import { compressPdf } from "./lib/compress";
import {
  downloadBytes,
  downloadText,
  formatBytes,
  pdfFileName,
} from "./lib/utils";
import type {
  Annotation,
  OutlineNode,
  PdfMetadata,
  ToolId,
} from "./types";
import { TopBar } from "./components/TopBar";
import { Welcome } from "./components/Welcome";
import { Sidebar, type SidebarTab } from "./components/Sidebar";
import { Viewer, type FitMode } from "./components/Viewer";
import { PasswordModal } from "./components/PasswordModal";
import { Toast, type ToastMessage } from "./components/Toast";
import { ViewPanel } from "./components/panels/ViewPanel";
import { AnnotatePanel } from "./components/panels/AnnotatePanel";
import { PagesPanel } from "./components/panels/PagesPanel";
import { FormsPanel } from "./components/panels/FormsPanel";
import { EditPanel } from "./components/panels/EditPanel";
import { ProtectPanel } from "./components/panels/ProtectPanel";
import { OcrPanel } from "./components/panels/OcrPanel";
import { ComparePanel } from "./components/panels/ComparePanel";
import { PrivacyPanel } from "./components/panels/PrivacyPanel";
import "./styles.css";

interface OpenDocument {
  bytes: Uint8Array;
  fileName: string;
  pdf: PDFDocumentProxy;
  pageCount: number;
  metadata: PdfMetadata;
  outline: OutlineNode[];
  password?: string;
}

const readFileBytes = async (file: File): Promise<Uint8Array> =>
  new Uint8Array(await file.arrayBuffer());

const isPdfFile = (file: File): boolean =>
  file.type === "application/pdf" || /\.pdf$/i.test(file.name);

export default function App() {
  const { t, lang } = useI18n();
  const [doc, setDoc] = useState<OpenDocument | null>(null);
  const [themeMode, setThemeMode] = useState<ThemeMode>(readThemeMode);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [fitMode, setFitMode] = useState<FitMode>("width");
  const [rotations, setRotations] = useState<number[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [history, setHistory] = useState<Annotation[][]>([]);
  const [future, setFuture] = useState<Annotation[][]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tool, setTool] = useState<ToolId>("select");
  const [color, setColor] = useState("#facc15");
  const [opacity, setOpacity] = useState(0.35);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [fontSize, setFontSize] = useState(14);
  const [pendingAsset, setPendingAsset] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("view");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Abrindo PDF…");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ message: string; value?: number } | null>(null);
  const [passwordRequest, setPasswordRequest] = useState<{ bytes: Uint8Array; fileName: string } | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchHits, setSearchHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [searchBoxes, setSearchBoxes] = useState<Array<{ x: number; y: number; width: number; height: number }>>([]);
  const [speaking, setSpeaking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toastId = useRef(0);

  const notify = useCallback((message: string, type: "info" | "error" | "success" = "info") => {
    toastId.current += 1;
    setToast({ id: toastId.current, message, type });
  }, []);

  useEffect(() => {
    applyTheme(themeMode);
    if (themeMode !== "system") return;
    return watchSystemTheme(() => applyTheme("system"));
  }, [themeMode]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 5200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const openBytes = useCallback(
    async (bytes: Uint8Array, fileName: string, password?: string) => {
      setLoading(true);
      setLoadingMessage(t("Abrindo PDF…"));
      try {
        const pdf = await loadPdfJs(bytes, password);
        setLoadingMessage(t("Lendo estrutura e metadados…"));
        const [metadata, outline] = await Promise.all([getMetadata(pdf), getOutline(pdf)]);
        window.speechSynthesis?.cancel();
        setSpeaking(false);
        setDoc({
          bytes,
          fileName,
          pdf,
          pageCount: pdf.numPages,
          metadata,
          outline,
          password,
        });
        setCurrentPage(1);
        setZoom(1);
        setFitMode("width");
        setRotations(Array(pdf.numPages).fill(0));
        setAnnotations([]);
        setHistory([]);
        setFuture([]);
        setSelectedId(null);
        setSelectedPages(new Set());
        setTool("select");
        setPendingAsset(null);
        setSearchOpen(false);
        setSearchQuery("");
        setSearchHits([]);
        setSearchBoxes([]);
        setSidebarTab("view");
        notify(t("PDF aberto localmente."), "success");
      } catch (error) {
        if (error instanceof PasswordRequiredError) {
          setPasswordRequest({ bytes, fileName });
          if (password) notify(t("Senha incorreta. Tente novamente."), "error");
          return;
        }
        console.error(error);
        notify(t("Não foi possível abrir o PDF. Verifique se o arquivo é válido."), "error");
      } finally {
        setLoading(false);
      }
    },
    [notify, t],
  );

  const handleOpenFiles = useCallback(
    async (files: File[]) => {
      const pdfs = files.filter(isPdfFile);
      if (pdfs.length === 0) {
        notify(t("Selecione um arquivo PDF."), "error");
        return;
      }
      try {
        if (pdfs.length === 1) {
          const bytes = await readFileBytes(pdfs[0]);
          await openBytes(bytes, pdfs[0].name);
          return;
        }
        setLoading(true);
        setLoadingMessage(t("Mesclando arquivos…"));
        const documents = await Promise.all(
          pdfs.map(async (file) => ({ bytes: await readFileBytes(file) })),
        );
        const merged = await mergePdfs(documents);
        await openBytes(merged.bytes, "documento-mesclado.pdf");
      } catch (error) {
        console.error(error);
        notify(t("Não foi possível abrir/mesclar os arquivos. PDFs protegidos devem ser abertos individualmente."), "error");
        setLoading(false);
      }
    },
    [notify, openBytes, t],
  );

  const handleSample = useCallback(async () => {
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}sample.pdf`);
      if (!response.ok) throw new Error("sample missing");
      const bytes = new Uint8Array(await response.arrayBuffer());
      await openBytes(bytes, "exemplo-openpdf.pdf");
    } catch {
      notify(t("O PDF de exemplo não está disponível. Gere-o com npm run sample."), "error");
    }
  }, [notify, openBytes, t]);

  const handleBlank = useCallback(async () => {
    try {
      const document = await PDFDocument.create();
      const page = document.addPage([595.28, 841.89]);
      const font = await document.embedFont(StandardFonts.Helvetica);
      const bold = await document.embedFont(StandardFonts.HelveticaBold);
      page.drawRectangle({ x: 40, y: 40, width: 515, height: 762, borderColor: rgb(0.86, 0.88, 0.92), borderWidth: 1 });
      page.drawText("OpenPDF Studio", { x: 64, y: 742, size: 28, font: bold, color: rgb(0.06, 0.09, 0.16) });
      page.drawText("Documento em branco criado localmente no navegador.", { x: 64, y: 710, size: 12, font, color: rgb(0.35, 0.4, 0.5) });
      page.drawText("Use as ferramentas à esquerda para anotar, editar, assinar, proteger ou aplicar OCR.", { x: 64, y: 670, size: 12, font, color: rgb(0.2, 0.25, 0.35) });
      page.drawLine({ start: { x: 64, y: 640 }, end: { x: 531, y: 640 }, thickness: 1, color: rgb(0.85, 0.88, 0.93) });
      page.drawText("Seus arquivos não saem deste dispositivo.", { x: 64, y: 600, size: 11, font, color: rgb(0.1, 0.55, 0.45) });
      const bytes = await document.save();
      await openBytes(bytes, "documento-em-branco.pdf");
    } catch (error) {
      console.error(error);
      notify(t("Não foi possível criar o PDF em branco."), "error");
    }
  }, [notify, openBytes, t]);

  const materialize = useCallback(async (): Promise<Uint8Array> => {
    if (!doc) throw new Error("Nenhum documento aberto.");
    return buildPdfWithAnnotations(doc.bytes, annotations, rotations, { password: doc.password });
  }, [annotations, doc, rotations]);

  const handleDownload = useCallback(async () => {
    if (!doc) return;
    if (
      doc.password &&
      !window.confirm(
        t("Este PDF foi aberto com senha. O arquivo baixado será desbloqueado (sem a proteção atual). Para manter a proteção, use a aba Proteger. Continuar?"),
      )
    ) {
      return;
    }
    setBusy(true);
    setProgress({ message: t("Aplicando anotações e rotações…"), value: 0.4 });
    try {
      const bytes = await materialize();
      downloadBytes(bytes, pdfFileName(doc.fileName, annotations.length > 0 ? t("editado") : t("copia")));
      notify(t("PDF baixado. O arquivo original permanece intacto."), "success");
    } catch (error) {
      console.error(error);
      notify(t("Não foi possível gerar o PDF."), "error");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }, [annotations.length, doc, materialize, notify, t]);

  const commit = useCallback(
    (next: Annotation[]) => {
      setHistory((current) => [...current.slice(-49), annotations]);
      setFuture([]);
      setAnnotations(next);
    },
    [annotations],
  );

  const addAnnotation = useCallback(
    (annotation: Annotation) => {
      setHistory((current) => [...current.slice(-49), annotations]);
      setFuture([]);
      setAnnotations((current) => [...current, annotation]);
    },
    [annotations],
  );

  const updateAnnotation = useCallback((id: string, patch: Partial<Annotation>) => {
    setAnnotations((current) =>
      current.map((annotation) => (annotation.id === id ? ({ ...annotation, ...patch } as Annotation) : annotation)),
    );
  }, []);

  const deleteAnnotation = useCallback(
    (id: string) => {
      setHistory((current) => [...current.slice(-49), annotations]);
      setFuture([]);
      setAnnotations((current) => current.filter((annotation) => annotation.id !== id));
      setSelectedId((current) => (current === id ? null : current));
    },
    [annotations],
  );

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory(history.slice(0, -1));
    setFuture([annotations, ...future].slice(0, 50));
    setAnnotations(previous);
    setSelectedId(null);
  }, [annotations, future, history]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture(future.slice(1));
    setHistory((current) => [...current.slice(-49), annotations]);
    setAnnotations(next);
    setSelectedId(null);
  }, [annotations, future]);

  const clearAnnotations = useCallback(() => {
    if (annotations.length === 0) return;
    if (!window.confirm(t("Remover todas as anotações deste documento?"))) return;
    commit([]);
    setSelectedId(null);
  }, [annotations.length, commit, t]);

  const handleRotate = useCallback(
    (delta: number) => {
      if (!doc) return;
      const targets = selectedPages.size > 0 ? Array.from(selectedPages) : [currentPage];
      setRotations((current) => {
        const next = [...current];
        for (const page of targets) {
          const index = page - 1;
          if (index >= 0 && index < next.length) next[index] = ((next[index] ?? 0) + delta + 360) % 360;
        }
        return next;
      });
    },
    [currentPage, doc, selectedPages],
  );

  const replaceDocument = useCallback(
    async (bytes: Uint8Array, label: string) => {
      if (!doc) return;
      await openBytes(bytes, pdfFileName(doc.fileName, label));
      setSidebarTab("view");
    },
    [doc, openBytes],
  );

  const handleMovePage = useCallback(
    async (from: number, to: number) => {
      if (!doc) return;
      setBusy(true);
      setProgress({ message: t("Reordenando páginas…"), value: 0.4 });
      try {
        const order = Array.from({ length: doc.pageCount }, (_, index) => index);
        const [moved] = order.splice(from, 1);
        order.splice(to, 0, moved);
        const prepared = await materialize();
        const result = await reorderPages(prepared, order, Array(order.length).fill(0));
        await replaceDocument(result.bytes, "reordenado");
        notify(t("Páginas reordenadas."), "success");
      } catch (error) {
        console.error(error);
        notify(t("Não foi possível reordenar as páginas."), "error");
      } finally {
        setBusy(false);
        setProgress(null);
      }
    },
    [doc, materialize, notify, replaceDocument, t],
  );

  const targetPages = useCallback((): number[] => {
    if (selectedPages.size > 0) return Array.from(selectedPages).sort((a, b) => a - b);
    return [currentPage];
  }, [currentPage, selectedPages]);

  const handleDeletePages = useCallback(async () => {
    if (!doc) return;
    const pages = targetPages().map((page) => page - 1);
    if (pages.length >= doc.pageCount) {
      notify(t("O documento precisa manter pelo menos uma página."), "error");
      return;
    }
    if (!window.confirm(t("Excluir {n} página(s)? As anotações serão achatadas antes.", { n: pages.length }))) return;
    setBusy(true);
    setProgress({ message: t("Excluindo páginas…"), value: 0.4 });
    try {
      const prepared = await materialize();
      const result = await deletePages(prepared, pages);
      await replaceDocument(result.bytes, "paginas-excluidas");
      notify(t("Páginas excluídas."), "success");
    } catch (error) {
      console.error(error);
      notify(t("Não foi possível excluir as páginas."), "error");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }, [doc, materialize, notify, replaceDocument, targetPages, t]);

  const handleDuplicatePages = useCallback(async () => {
    if (!doc) return;
    const pages = targetPages().map((page) => page - 1);
    setBusy(true);
    setProgress({ message: t("Duplicando páginas…"), value: 0.4 });
    try {
      const prepared = await materialize();
      const result = await duplicatePages(prepared, pages);
      await replaceDocument(result.bytes, "paginas-duplicadas");
      notify(t("Páginas duplicadas."), "success");
    } catch (error) {
      console.error(error);
      notify(t("Não foi possível duplicar as páginas."), "error");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }, [doc, materialize, notify, replaceDocument, targetPages, t]);

  const handleExtractPages = useCallback(async () => {
    if (!doc) return;
    const pages = targetPages().map((page) => page - 1);
    setBusy(true);
    setProgress({ message: t("Extraindo páginas…"), value: 0.4 });
    try {
      const prepared = await materialize();
      const result = await extractPages(prepared, pages);
      downloadBytes(result.bytes, pdfFileName(doc.fileName, "paginas-extraidas"));
      notify(t("Páginas extraídas ({n}).", { n: result.pageCount }), "success");
    } catch (error) {
      console.error(error);
      notify(t("Não foi possível extrair as páginas."), "error");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }, [doc, materialize, notify, targetPages, t]);

  const handleMergeFiles = useCallback(
    async (files: File[]) => {
      if (!doc) return;
      const pdfs = files.filter(isPdfFile);
      if (pdfs.length === 0) {
        notify(t("Selecione pelo menos um PDF."), "error");
        return;
      }
      setBusy(true);
      setProgress({ message: t("Mesclando PDFs…"), value: 0.3 });
      try {
        const prepared = await materialize();
        const documents = [{ bytes: prepared }, ...(await Promise.all(pdfs.map(async (file) => ({ bytes: await readFileBytes(file) }))))];
        const result = await mergePdfs(documents);
        await replaceDocument(result.bytes, "mesclado");
        notify(t("PDFs mesclados."), "success");
      } catch (error) {
        console.error(error);
        notify(t("Não foi possível mesclar. Verifique se os PDFs não estão protegidos."), "error");
      } finally {
        setBusy(false);
        setProgress(null);
      }
    },
    [doc, materialize, notify, replaceDocument, t],
  );

  const handleSplit = useCallback(
    async (afterPage: number) => {
      if (!doc) return;
      setBusy(true);
      setProgress({ message: t("Dividindo documento…"), value: 0.4 });
      try {
        const prepared = await materialize();
        const result = await splitAtPage(prepared, afterPage);
        downloadBytes(result.first.bytes, pdfFileName(doc.fileName, `parte-1`));
        downloadBytes(result.second.bytes, pdfFileName(doc.fileName, `parte-2`));
        notify(t("Documento dividido em dois PDFs."), "success");
      } catch (error) {
        console.error(error);
        notify(String((error as Error).message ?? error), "error");
      } finally {
        setBusy(false);
        setProgress(null);
      }
    },
    [doc, materialize, notify, t],
  );

  const handleApplyRedactions = useCallback(
    async (options: { dpi: number; stripMetadata: boolean }) => {
      if (!doc) return;
      setBusy(true);
      setProgress({ message: t("Preparando redação…"), value: 0.03 });
      try {
        const result = await applyRedactions(
          doc.bytes,
          annotations,
          rotations,
          { password: doc.password, ...options },
          (message, value) => setProgress({ message, value }),
        );
        downloadBytes(result, pdfFileName(doc.fileName, "redigido"));
        notify(t("Redação aplicada. O PDF redigido foi baixado."), "success");
      } catch (error) {
        console.error(error);
        notify(String((error as Error).message ?? error), "error");
      } finally {
        setBusy(false);
        setProgress(null);
      }
    },
    [annotations, doc, notify, rotations, t],
  );

  const handleCompress = useCallback(
    async (options: { dpi: number; quality: number }) => {
      if (!doc) return;
      setBusy(true);
      setProgress({ message: t("Comprimindo PDF…"), value: 0.03 });
      try {
        const result = await compressPdf(
          doc.bytes,
          annotations,
          rotations,
          { password: doc.password, ...options },
          (message, value) => setProgress({ message, value }),
        );
        downloadBytes(result, pdfFileName(doc.fileName, "comprimido"));
        const delta = result.byteLength - doc.bytes.byteLength;
        notify(
          t("PDF comprimido: {from} → {to}{delta}.", {
            from: formatBytes(doc.bytes.byteLength),
            to: formatBytes(result.byteLength),
            delta: delta < 0 ? ` (−${formatBytes(-delta)})` : "",
          }),
          "success",
        );
      } catch (error) {
        console.error(error);
        notify(t("Não foi possível comprimir o PDF."), "error");
      } finally {
        setBusy(false);
        setProgress(null);
      }
    },
    [annotations, doc, notify, rotations, t],
  );

  const handleExportJson = useCallback(() => {
    if (!doc) return;
    const payload = {
      app: "OpenPDF Studio",
      version: 1,
      fileName: doc.fileName,
      pageRotations: rotations,
      annotations,
    };
    downloadText(JSON.stringify(payload, null, 2), pdfFileName(doc.fileName, "anotacoes").replace(/\.pdf$/, ".json"));
    notify(t("Anotações exportadas em JSON."), "success");
  }, [annotations, doc, notify, rotations, t]);

  const runSearch = useCallback(async () => {
    if (!doc || !searchQuery.trim()) return;
    setSearching(true);
    setSearchProgress(0);
    try {
      const hits = await searchDocument(doc.pdf, searchQuery, (page, total) => setSearchProgress(page / total));
      setSearchHits(hits);
      if (hits.length === 0) notify(t("Nenhuma ocorrência encontrada."), "info");
    } catch (error) {
      console.error(error);
      notify(t("Falha na busca."), "error");
    } finally {
      setSearching(false);
    }
  }, [doc, notify, searchQuery, t]);

  useEffect(() => {
    if (!doc || !searchQuery.trim()) {
      setSearchBoxes([]);
      return;
    }
    let cancelled = false;
    findSearchBoxes(doc.pdf, currentPage, searchQuery)
      .then((boxes) => {
        if (!cancelled) setSearchBoxes(boxes);
      })
      .catch(() => {
        if (!cancelled) setSearchBoxes([]);
      });
    return () => {
      cancelled = true;
    };
  }, [currentPage, doc, searchQuery]);

  const toggleReadAloud = useCallback(async () => {
    if (!doc) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    try {
      const text = await getPageText(doc.pdf, currentPage);
      if (!text) {
        notify(t("Esta página não tem texto extraível. Use o OCR."), "info");
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.slice(0, 12_000));
      utterance.lang = lang === "pt" ? "pt-BR" : "en-US";
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      setSpeaking(true);
      window.speechSynthesis.speak(utterance);
    } catch {
      notify(t("Não foi possível iniciar a leitura."), "error");
      setSpeaking(false);
    }
  }, [currentPage, doc, lang, notify, speaking, t]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const editing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable);
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "o") {
        event.preventDefault();
        fileInputRef.current?.click();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (doc) void handleDownload();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") {
        event.preventDefault();
        setSearchOpen(true);
        return;
      }
      if (editing) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
        return;
      }
      if (event.key === "ArrowLeft" && doc) {
        setCurrentPage((page) => Math.max(1, page - 1));
      } else if (event.key === "ArrowRight" && doc) {
        setCurrentPage((page) => Math.min(doc.pageCount, page + 1));
      } else if ((event.key === "Delete" || event.key === "Backspace") && selectedId) {
        event.preventDefault();
        deleteAnnotation(selectedId);
      } else if (event.key === "Escape") {
        setTool("select");
        setSelectedId(null);
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [deleteAnnotation, doc, handleDownload, redo, selectedId, undo]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("sample") === "1") {
      url.searchParams.delete("sample");
      window.history.replaceState({}, "", url.pathname + url.hash);
      void handleSample();
    }
  }, [handleSample]);

  const selectedAnnotation = useMemo(
    () => annotations.find((annotation) => annotation.id === selectedId) ?? null,
    [annotations, selectedId],
  );

  const rotation = rotations[currentPage - 1] ?? 0;

  const panel = (() => {
    if (!doc) return null;
    switch (sidebarTab) {
      case "view":
        return (
          <ViewPanel
            pdf={doc.pdf}
            numPages={doc.pageCount}
            currentPage={currentPage}
            rotation={rotation}
            outline={doc.outline}
            metadata={doc.metadata}
            onPageChange={setCurrentPage}
            onRotatePage={() => handleRotate(90)}
          />
        );
      case "annotate":
        return (
          <AnnotatePanel
            tool={tool}
            color={color}
            opacity={opacity}
            strokeWidth={strokeWidth}
            fontSize={fontSize}
            annotations={annotations}
            selected={selectedAnnotation}
            canUndo={history.length > 0}
            canRedo={future.length > 0}
            onToolChange={setTool}
            onColorChange={setColor}
            onOpacityChange={setOpacity}
            onStrokeWidthChange={setStrokeWidth}
            onFontSizeChange={setFontSize}
            onSelect={setSelectedId}
            onUpdate={updateAnnotation}
            onDelete={deleteAnnotation}
            onUndo={undo}
            onRedo={redo}
            onClear={clearAnnotations}
            onDownload={handleDownload}
            onExportJson={handleExportJson}
          />
        );
      case "pages":
        return (
          <PagesPanel
            pdf={doc.pdf}
            numPages={doc.pageCount}
            currentPage={currentPage}
            rotation={rotation}
            selectedPages={selectedPages}
            onTogglePage={(page) => {
              setSelectedPages((current) => {
                const next = new Set(current);
                if (next.has(page)) next.delete(page);
                else next.add(page);
                return next;
              });
            }}
            onSelectAll={() => setSelectedPages(new Set(Array.from({ length: doc.pageCount }, (_, index) => index + 1)))}
            onClearSelection={() => setSelectedPages(new Set())}
            onPageChange={setCurrentPage}
            onMovePage={handleMovePage}
            onRotate={handleRotate}
            onDuplicate={handleDuplicatePages}
            onDelete={handleDeletePages}
            onExtract={handleExtractPages}
            onMergeFiles={handleMergeFiles}
            onSplit={handleSplit}
          />
        );
      case "forms":
        return <FormsPanel bytes={doc.bytes} fileName={doc.fileName} password={doc.password} onNotify={notify} />;
      case "edit":
        return (
          <EditPanel
            tool={tool}
            color={color}
            opacity={opacity}
            fontSize={fontSize}
            pendingAsset={pendingAsset}
            redactionCount={annotations.filter((annotation) => annotation.type === "redact").length}
            busy={busy}
            progress={progress}
            onToolChange={setTool}
            onColorChange={setColor}
            onOpacityChange={setOpacity}
            onFontSizeChange={setFontSize}
            onPendingAsset={setPendingAsset}
            onClearRedactions={() => {
              setHistory((current) => [...current.slice(-49), annotations]);
              setFuture([]);
              setAnnotations((current) => current.filter((annotation) => annotation.type !== "redact"));
            }}
            onApplyRedactions={handleApplyRedactions}
            onCompress={handleCompress}
          />
        );
      case "protect":
        return <ProtectPanel bytes={doc.bytes} fileName={doc.fileName} password={doc.password} onNotify={notify} />;
      case "ocr":
        return (
          <OcrPanel
            pdf={doc.pdf}
            bytes={doc.bytes}
            password={doc.password}
            currentPage={currentPage}
            numPages={doc.pageCount}
            fileName={doc.fileName}
            onNotify={notify}
          />
        );
      case "compare":
        return <ComparePanel pdf={doc.pdf} fileName={doc.fileName} onNotify={notify} />;
      case "privacy":
        return <PrivacyPanel />;
      default:
        return null;
    }
  })();

  return (
    <div className="app">
      <TopBar
        fileName={doc?.fileName}
        numPages={doc?.pageCount}
        fileSize={doc?.bytes.byteLength}
        hasDocument={!!doc}
        isProtected={!!doc?.password}
        themeMode={themeMode}
        onCycleTheme={() =>
          setThemeMode((current) => (current === "system" ? "light" : current === "light" ? "dark" : "system"))
        }
        sidebarOpen={sidebarOpen}
        canUndo={history.length > 0}
        canRedo={future.length > 0}
        onOpen={() => fileInputRef.current?.click()}
        onDownload={handleDownload}
        onUndo={undo}
        onRedo={redo}
        onToggleSidebar={() => setSidebarOpen((current) => !current)}
      />

      <div className={`app-body ${sidebarOpen && doc ? "" : "sidebar-closed"}`}>
        {doc && sidebarOpen && (
          <Sidebar activeTab={sidebarTab} onTabChange={setSidebarTab}>
            {panel}
          </Sidebar>
        )}
        {doc ? (
          <Viewer
            pdf={doc.pdf}
            pageNumber={currentPage}
            numPages={doc.pageCount}
            zoom={zoom}
            fitMode={fitMode}
            rotation={rotation}
            annotations={annotations}
            tool={tool}
            color={color}
            strokeWidth={strokeWidth}
            opacity={opacity}
            fontSize={fontSize}
            selectedId={selectedId}
            searchBoxes={searchBoxes}
            pendingAsset={pendingAsset}
            searchOpen={searchOpen}
            searchQuery={searchQuery}
            searchHits={searchHits}
            searching={searching}
            searchProgress={searchProgress}
            speaking={speaking}
            onPageChange={setCurrentPage}
            onZoomChange={setZoom}
            onFitModeChange={setFitMode}
            onRotate={handleRotate}
            onAddAnnotation={addAnnotation}
            onUpdateAnnotation={updateAnnotation}
            onSelectAnnotation={setSelectedId}
            onOpenSearch={() => setSearchOpen(true)}
            onCloseSearch={() => setSearchOpen(false)}
            onSearchQueryChange={setSearchQuery}
            onSearch={runSearch}
            onSelectSearchHit={(hit) => {
              setCurrentPage(hit.pageNumber);
              setSearchOpen(true);
            }}
            onToggleReadAloud={toggleReadAloud}
          />
        ) : (
          <Welcome onOpenFiles={handleOpenFiles} onOpenSample={handleSample} onOpenBlank={handleBlank} />
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        hidden
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length > 0) void handleOpenFiles(files);
          event.target.value = "";
        }}
      />

      {passwordRequest && (
        <PasswordModal
          fileName={passwordRequest.fileName}
          onSubmit={(password) => {
            const request = passwordRequest;
            setPasswordRequest(null);
            void openBytes(request.bytes, request.fileName, password);
          }}
          onCancel={() => setPasswordRequest(null)}
        />
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />

      {loading && (
        <div className="loading-overlay">
          <div className="loading-card">
            <span className="spinner large" />
            <strong>{loadingMessage}</strong>
            <span className="muted small">{t("Processando no seu dispositivo…")}</span>
          </div>
        </div>
      )}
    </div>
  );
}
