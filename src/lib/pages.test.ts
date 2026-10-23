import { describe, expect, it } from "vitest";
import { PDFDocument } from "@cantoo/pdf-lib";
import {
  deletePages,
  duplicatePages,
  extractPages,
  mergePdfs,
  reorderPages,
  splitAtPage,
} from "./pages";

const makePdf = async (pages: number): Promise<Uint8Array> => {
  const document = await PDFDocument.create();
  document.setTitle("Teste");
  document.setAuthor("OpenPDF");
  for (let index = 0; index < pages; index += 1) {
    const page = document.addPage([300, 400]);
    page.drawText(`Página ${index + 1}`);
  }
  return document.save();
};

describe("page operations", () => {
  it("reorders pages and preserves metadata", async () => {
    const bytes = await makePdf(3);
    const result = await reorderPages(bytes, [2, 0, 1], [0, 90, 0]);
    expect(result.pageCount).toBe(3);
    const document = await PDFDocument.load(result.bytes);
    expect(document.getTitle()).toBe("Teste");
    expect(document.getAuthor()).toBe("OpenPDF");
    expect(document.getPage(1).getRotation().angle).toBe(90);
  });

  it("deletes pages while keeping at least one", async () => {
    const bytes = await makePdf(3);
    const result = await deletePages(bytes, [1]);
    expect(result.pageCount).toBe(2);
    await expect(deletePages(bytes, [0, 1, 2])).rejects.toThrow("pelo menos uma página");
  });

  it("extracts and duplicates explicit pages", async () => {
    const bytes = await makePdf(4);
    const extracted = await extractPages(bytes, [0, 2]);
    expect(extracted.pageCount).toBe(2);
    const duplicated = await duplicatePages(bytes, [1]);
    expect(duplicated.pageCount).toBe(5);
  });

  it("merges documents and splits at a page", async () => {
    const first = await makePdf(2);
    const second = await makePdf(3);
    const merged = await mergePdfs([{ bytes: first }, { bytes: second }]);
    expect(merged.pageCount).toBe(5);
    const split = await splitAtPage(merged.bytes, 2);
    expect(split.first.pageCount).toBe(2);
    expect(split.second.pageCount).toBe(3);
  });
});
