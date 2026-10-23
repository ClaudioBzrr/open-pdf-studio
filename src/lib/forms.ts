import {
  PDFCheckBox,
  PDFDocument,
  PDFDropdown,
  PDFOptionList,
  PDFRadioGroup,
  PDFTextField,
} from "@cantoo/pdf-lib";
import type { FormFieldDescriptor } from "../types";

export const loadFormFields = async (bytes: Uint8Array, password?: string): Promise<FormFieldDescriptor[]> => {
  const document = await PDFDocument.load(new Uint8Array(bytes), {
    password,
    updateMetadata: false,
    throwOnInvalidObject: false,
  });
  const form = document.getForm();
  return form.getFields().map((field) => {
    const name = field.getName();
    const base: FormFieldDescriptor = {
      name,
      type: "unknown",
      value: "",
      readOnly: field.isReadOnly(),
      required: field.isRequired(),
    };
    if (field instanceof PDFTextField) {
      return {
        ...base,
        type: "text",
        value: field.getText() ?? "",
        multiline: field.isMultiline(),
      };
    }
    if (field instanceof PDFCheckBox) {
      return { ...base, type: "checkbox", value: field.isChecked() ? "true" : "false", checked: field.isChecked() };
    }
    if (field instanceof PDFRadioGroup) {
      return {
        ...base,
        type: "radio",
        value: field.getSelected() ?? "",
        options: field.getOptions(),
      };
    }
    if (field instanceof PDFDropdown) {
      return {
        ...base,
        type: "dropdown",
        value: field.getSelected()[0] ?? "",
        options: field.getOptions(),
      };
    }
    if (field instanceof PDFOptionList) {
      return {
        ...base,
        type: "option-list",
        value: field.getSelected()[0] ?? "",
        options: field.getOptions(),
      };
    }
    return base;
  });
};

export interface FormValue {
  name: string;
  type: FormFieldDescriptor["type"];
  value: string;
  checked?: boolean;
}

export const fillForm = async (
  bytes: Uint8Array,
  values: FormValue[],
  options: { password?: string; flatten?: boolean } = {},
): Promise<Uint8Array> => {
  const document = await PDFDocument.load(new Uint8Array(bytes), {
    password: options.password,
    updateMetadata: false,
    throwOnInvalidObject: false,
  });
  const form = document.getForm();
  for (const value of values) {
    const field = form.getField(value.name);
    if (!field || field.isReadOnly()) continue;
    if (field instanceof PDFTextField) {
      field.setText(value.value);
      continue;
    }
    if (field instanceof PDFCheckBox) {
      if (value.checked ?? value.value === "true") field.check();
      else field.uncheck();
      continue;
    }
    if (field instanceof PDFRadioGroup) {
      field.select(value.value);
      continue;
    }
    if (field instanceof PDFDropdown) {
      if (value.value) field.select(value.value);
      continue;
    }
    if (field instanceof PDFOptionList) {
      if (value.value) field.select(value.value);
    }
  }
  if (typeof form.updateFieldAppearances === "function") {
    form.updateFieldAppearances();
  }
  if (options.flatten) form.flatten();
  return document.save({ useObjectStreams: true });
};
