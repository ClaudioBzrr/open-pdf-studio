import { PDFDocument, degrees } from "@cantoo/pdf-lib";
import type { PageOperationResult } from "../types";

const load = async (bytes: Uint8Array, password?: string) =>
  PDFDocument.load(new Uint8Array(bytes), {
    password,
    updateMetadata: false,
    throwOnInvalidObject: false,
  });

const save = async (document: PDFDocument): Promise<Uint8Array> =>
  document.save({ useObjectStreams: true });

const copyMetadata = (source: PDFDocument, target: PDFDocument): void => {
  const title = source.getTitle();
  const author = source.getAuthor();
  const subject = source.getSubject();
  const keywords = source.getKeywords();
  const creator = source.getCreator();
  const producer = source.getProducer();
  if (title) target.setTitle(title);
  if (author) target.setAuthor(author);
  if (subject) target.setSubject(subject);
  if (keywords) {
    const parts = keywords.split(/[,;]\s*/).filter(Boolean);
    if (parts.length > 0) target.setKeywords(parts);
  }
  if (creator) target.setCreator(creator);
  if (producer) target.setProducer(producer);
};

export const reorderPages = async (
  bytes: Uint8Array,
  order: number[],
  rotations: number[],
  password?: string,
): Promise<PageOperationResult> => {
  const source = await load(bytes, password);
  const target = await PDFDocument.create();
  const copied = await target.copyPages(source, order);
  copied.forEach((page, index) => {
    const rotation = (page.getRotation().angle + (rotations[index] ?? 0)) % 360;
    page.setRotation(degrees(rotation));
    target.addPage(page);
  });
  copyMetadata(source, target);
  return { bytes: await save(target), pageCount: target.getPageCount() };
};

export const deletePages = async (
  bytes: Uint8Array,
  pagesToDelete: number[],
  password?: string,
): Promise<PageOperationResult> => {
  const source = await load(bytes, password);
  const remove = new Set(pagesToDelete);
  const keep = Array.from({ length: source.getPageCount() }, (_, index) => index).filter(
    (index) => !remove.has(index),
  );
  if (keep.length === 0) throw new Error("O PDF precisa manter pelo menos uma página.");
  return reorderPages(bytes, keep, [], password);
};

export const extractPages = async (
  bytes: Uint8Array,
  pages: number[],
  password?: string,
): Promise<PageOperationResult> => {
  if (pages.length === 0) throw new Error("Selecione pelo menos uma página.");
  const source = await load(bytes, password);
  const target = await PDFDocument.create();
  const copied = await target.copyPages(source, pages);
  copied.forEach((page) => target.addPage(page));
  copyMetadata(source, target);
  return { bytes: await save(target), pageCount: target.getPageCount() };
};

export const duplicatePages = async (
  bytes: Uint8Array,
  pages: number[],
  password?: string,
): Promise<PageOperationResult> => {
  const source = await load(bytes, password);
  const target = await PDFDocument.create();
  const all = Array.from({ length: source.getPageCount() }, (_, index) => index);
  const additions = new Set(pages);
  const sequence: number[] = [];
  for (const index of all) {
    sequence.push(index);
    if (additions.has(index)) sequence.push(index);
  }
  const copied = await target.copyPages(source, sequence);
  copied.forEach((page) => target.addPage(page));
  copyMetadata(source, target);
  return { bytes: await save(target), pageCount: target.getPageCount() };
};

export const mergePdfs = async (
  documents: Array<{ bytes: Uint8Array; password?: string }>,
): Promise<PageOperationResult> => {
  if (documents.length === 0) throw new Error("Nenhum PDF para mesclar.");
  const target = await PDFDocument.create();
  let metadataSource: PDFDocument | null = null;
  for (const item of documents) {
    const source = await load(item.bytes, item.password);
    if (!metadataSource) metadataSource = source;
    const copied = await target.copyPages(source, source.getPageIndices());
    copied.forEach((page) => target.addPage(page));
  }
  if (metadataSource) copyMetadata(metadataSource, target);
  return { bytes: await save(target), pageCount: target.getPageCount() };
};

export const splitAtPage = async (
  bytes: Uint8Array,
  splitAfter: number,
  password?: string,
): Promise<{ first: PageOperationResult; second: PageOperationResult }> => {
  const source = await load(bytes, password);
  const pageCount = source.getPageCount();
  if (splitAfter < 1 || splitAfter >= pageCount) {
    throw new Error(`Escolha uma divisão entre 1 e ${pageCount - 1}.`);
  }
  const firstPages = Array.from({ length: splitAfter }, (_, index) => index);
  const secondPages = Array.from({ length: pageCount - splitAfter }, (_, index) => splitAfter + index);
  return {
    first: await extractPages(bytes, firstPages, password),
    second: await extractPages(bytes, secondPages, password),
  };
};

export const rotatePage = async (
  bytes: Uint8Array,
  pageIndex: number,
  rotation: number,
  password?: string,
): Promise<PageOperationResult> => {
  const source = await load(bytes, password);
  const page = source.getPage(pageIndex);
  const angle = page.getRotation().angle;
  page.setRotation(degrees((angle + rotation + 360) % 360));
  return { bytes: await save(source), pageCount: source.getPageCount() };
};

export const setDocumentMetadata = async (
  bytes: Uint8Array,
  metadata: { title?: string; author?: string; subject?: string; keywords?: string },
  password?: string,
): Promise<Uint8Array> => {
  const document = await load(bytes, password);
  if (metadata.title !== undefined) document.setTitle(metadata.title);
  if (metadata.author !== undefined) document.setAuthor(metadata.author);
  if (metadata.subject !== undefined) document.setSubject(metadata.subject);
  if (metadata.keywords !== undefined) document.setKeywords(metadata.keywords.split(/[,;]\s*/));
  return save(document);
};
