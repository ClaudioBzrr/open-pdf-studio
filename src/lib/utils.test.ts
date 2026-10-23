import { describe, expect, it } from "vitest";
import { dataUrlToBytes, formatBytes, hexToRgb, pdfFileName } from "./utils";

describe("utils", () => {
  it("formats byte sizes", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatBytes(1024 * 1024 * 2.5)).toBe("2.5 MB");
  });

  it("parses short and long hex colors", () => {
    expect(hexToRgb("#fff")).toEqual({ r: 1, g: 1, b: 1 });
    const red = hexToRgb("#ff0000");
    expect(red.r).toBe(1);
    expect(red.g).toBe(0);
    expect(red.b).toBe(0);
  });

  it("builds safe PDF file names", () => {
    expect(pdfFileName("relatório final.pdf", "editado")).toBe("relatório final-editado.pdf");
    expect(pdfFileName("a/b:c.pdf", "copia")).toBe("a-b-c-copia.pdf");
  });

  it("decodes base64 data URLs", () => {
    const bytes = dataUrlToBytes("data:text/plain;base64,b3BlbnBkZg==");
    expect(new TextDecoder().decode(bytes)).toBe("openpdf");
  });
});
