import { PDFDocument } from "@cantoo/pdf-lib";

export interface PdfPermissions {
  printing: "none" | "lowResolution" | "highResolution";
  modifying: boolean;
  copying: boolean;
  annotating: boolean;
  fillingForms: boolean;
  contentAccessibility: boolean;
  documentAssembly: boolean;
}

export const defaultPermissions: PdfPermissions = {
  printing: "highResolution",
  modifying: false,
  copying: true,
  annotating: true,
  fillingForms: true,
  contentAccessibility: true,
  documentAssembly: false,
};

export const encryptPdf = async (
  bytes: Uint8Array,
  options: {
    userPassword: string;
    ownerPassword: string;
    permissions: PdfPermissions;
    password?: string;
  },
): Promise<Uint8Array> => {
  if (!options.userPassword) throw new Error("Defina uma senha de abertura.");
  if (!options.ownerPassword) throw new Error("Defina uma senha de proprietário.");
  const document = await PDFDocument.load(new Uint8Array(bytes), {
    password: options.password,
    updateMetadata: false,
    throwOnInvalidObject: false,
  });
  document.encrypt({
    userPassword: options.userPassword,
    ownerPassword: options.ownerPassword,
    algorithm: "AES-256",
    permissions: {
      printing: options.permissions.printing === "none" ? false : options.permissions.printing,
      modifying: options.permissions.modifying,
      copying: options.permissions.copying,
      annotating: options.permissions.annotating,
      fillingForms: options.permissions.fillingForms,
      contentAccessibility: options.permissions.contentAccessibility,
      documentAssembly: options.permissions.documentAssembly,
    },
  });
  return document.save({ useObjectStreams: true });
};

export const decryptPdf = async (bytes: Uint8Array, password: string): Promise<Uint8Array> => {
  const document = await PDFDocument.load(new Uint8Array(bytes), {
    password,
    updateMetadata: false,
    throwOnInvalidObject: false,
  });
  return document.save({ useObjectStreams: true });
};
