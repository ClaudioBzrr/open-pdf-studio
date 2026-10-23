import { PDFDocument, StandardFonts, rgb } from "@cantoo/pdf-lib";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const output = join(here, "..", "public", "sample.pdf");

const document = await PDFDocument.create();
document.setTitle("OpenPDF Studio — Documento de exemplo");
document.setAuthor("OpenPDF Studio");
document.setSubject("Exemplo para testar leitura, anotação, formulários, OCR e redação.");
document.setKeywords(["PDF", "exemplo", "privacidade", "open-source"]);
document.setCreator("OpenPDF Studio");
document.setProducer("OpenPDF Studio");

const regular = await document.embedFont(StandardFonts.Helvetica);
const bold = await document.embedFont(StandardFonts.HelveticaBold);
const mono = await document.embedFont(StandardFonts.Courier);

const ink = rgb(0.06, 0.09, 0.16);
const muted = rgb(0.38, 0.43, 0.53);
const accent = rgb(0.1, 0.72, 0.64);
const indigo = rgb(0.42, 0.47, 0.93);
const paper = rgb(1, 1, 1);
const soft = rgb(0.95, 0.97, 0.99);
const line = rgb(0.86, 0.89, 0.93);

const width = 595.28;
const height = 841.89;

const wrap = (text, font, size, maxWidth) => {
  const lines = [];
  for (const paragraph of text.split("\n")) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth || !current) current = candidate;
      else {
        lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
};

const textBlock = (page, text, { x, y, size = 11, font = regular, color = ink, maxWidth = 470, lineHeight = 1.55 }) => {
  let cursor = y;
  for (const line of wrap(text, font, size, maxWidth)) {
    page.drawText(line, { x, y: cursor, size, font, color });
    cursor -= size * lineHeight;
  }
  return cursor;
};

const footer = (page, index) => {
  page.drawLine({ start: { x: 56, y: 48 }, end: { x: width - 56, y: 48 }, thickness: 0.7, color: line });
  page.drawText("OpenPDF Studio · exemplo local", { x: 56, y: 34, size: 8, font: regular, color: muted });
  page.drawText(`${index} / 6`, { x: width - 78, y: 34, size: 8, font: regular, color: muted });
};

// Page 1 — cover
{
  const page = document.addPage([width, height]);
  page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(0.035, 0.05, 0.09) });
  page.drawRectangle({ x: 0, y: 0, width, height: 300, color: rgb(0.05, 0.08, 0.14) });
  page.drawCircle({ x: width - 90, y: height - 100, size: 150, color: rgb(0.08, 0.3, 0.28), opacity: 0.45 });
  page.drawCircle({ x: width - 40, y: height - 40, size: 100, color: rgb(0.16, 0.18, 0.5), opacity: 0.4 });
  page.drawText("OpenPDF", { x: 56, y: 610, size: 54, font: bold, color: paper });
  page.drawText("Studio", { x: 56, y: 575, size: 54, font: bold, color: accent });
  page.drawText("Documento de exemplo", { x: 58, y: 520, size: 20, font: bold, color: rgb(0.85, 0.9, 0.96) });
  page.drawText(
    "Use este arquivo para testar leitura, busca, anotações, formulários,\nassinatura visual, OCR, redação, compressão e proteção por senha.",
    { x: 58, y: 476, size: 12, font: regular, color: rgb(0.68, 0.74, 0.84), lineHeight: 19.2 },
  );
  page.drawRectangle({ x: 58, y: 380, width: 300, height: 48, color: rgb(0.06, 0.1, 0.17), borderColor: rgb(0.18, 0.3, 0.38), borderWidth: 1 });
  page.drawText("100% processado no navegador", { x: 74, y: 407, size: 12, font: bold, color: accent });
  page.drawText("Sem upload. Sem conta. Sem servidor de documentos.", { x: 74, y: 391, size: 9, font: regular, color: rgb(0.6, 0.68, 0.78) });
  page.drawText("PDF de demonstração · 6 páginas", { x: 58, y: 90, size: 10, font: mono, color: rgb(0.55, 0.62, 0.72) });
  footer(page, 1);
}

// Page 2 — features
{
  const page = document.addPage([width, height]);
  page.drawText("O que você pode fazer aqui", { x: 56, y: 760, size: 26, font: bold, color: ink });
  page.drawText("Uma caixa de ferramentas de PDF que roda inteiramente no cliente.", { x: 56, y: 732, size: 11, font: regular, color: muted });
  const features = [
    ["Leitura", "Zoom, rotação, miniaturas, sumário, busca e leitura em voz alta."],
    ["Anotação", "Marca-texto, comentários, caneta, formas, texto e imagens."],
    ["Organização", "Reordenar, excluir, duplicar, extrair, dividir e mesclar páginas."],
    ["Formulários", "Preencher campos AcroForm, atualizar aparências e achatar."],
    ["OCR", "Reconhecer texto em português e inglês com Tesseract.js local."],
    ["Proteção", "Criptografia AES-256, permissões e remoção de senha."],
    ["Redação", "Rasterização irreversível das áreas marcadas, com remoção de metadados."],
    ["Comparação", "Diferenças visuais entre duas versões, com destaque em vermelho."],
  ];
  let y = 680;
  features.forEach(([title, description], index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = 56 + column * 250;
    const top = 680 - row * 78;
    page.drawRectangle({ x, y: top - 55, width: 230, height: 62, color: soft, borderColor: line, borderWidth: 0.8 });
    page.drawText(title, { x: x + 14, y: top - 18, size: 12, font: bold, color: ink });
    textBlock(page, description, { x: x + 14, y: top - 33, size: 8.5, color: muted, maxWidth: 202, lineHeight: 1.35 });
  });
  footer(page, 2);
}

// Page 3 — table
{
  const page = document.addPage([width, height]);
  page.drawText("Comparação de recursos", { x: 56, y: 760, size: 26, font: bold, color: ink });
  page.drawText("Equivalências funcionais implementadas com bibliotecas open-source.", { x: 56, y: 732, size: 11, font: regular, color: muted });
  const rows = [
    ["Recurso", "OpenPDF Studio", "Observação"],
    ["Ler PDF", "Sim", "PDF.js"],
    ["Anotar", "Sim", "Achatado no export"],
    ["Editar texto", "Parcial", "Sobreposição, sem reflow"],
    ["Formulários", "Sim", "AcroForm"],
    ["Assinatura", "Visual", "Não certificada"],
    ["OCR", "Sim", "Tesseract.js local"],
    ["Redação", "Sim", "Rasteriza a página"],
    ["AES-256", "Sim", "pdf-lib"],
    ["Comparar", "Sim", "Diff visual"],
  ];
  const tableX = 56;
  const tableY = 680;
  const colWidths = [190, 150, 140];
  const rowHeight = 30;
  rows.forEach((row, rowIndex) => {
    const y = tableY - rowIndex * rowHeight;
    const isHeader = rowIndex === 0;
    page.drawRectangle({
      x: tableX,
      y: y - rowHeight,
      width: colWidths.reduce((a, b) => a + b, 0),
      height: rowHeight,
      color: isHeader ? rgb(0.08, 0.12, 0.2) : rowIndex % 2 === 0 ? soft : paper,
      borderColor: line,
      borderWidth: 0.6,
    });
    let x = tableX;
    row.forEach((cell, cellIndex) => {
      page.drawText(cell, {
        x: x + 8,
        y: y - 20,
        size: 9,
        font: isHeader ? bold : regular,
        color: isHeader ? paper : cell === "Sim" ? rgb(0.05, 0.55, 0.45) : ink,
      });
      x += colWidths[cellIndex];
    });
  });
  footer(page, 3);
}

// Page 4 — form
{
  const page = document.addPage([width, height]);
  page.drawText("Formulário de exemplo", { x: 56, y: 760, size: 26, font: bold, color: ink });
  page.drawText("Preencha os campos na aba Formulários e baixe uma cópia preenchida.", { x: 56, y: 732, size: 11, font: regular, color: muted });
  page.drawRectangle({ x: 56, y: 470, width: 480, height: 230, color: soft, borderColor: line, borderWidth: 1 });

  page.drawText("Nome completo", { x: 76, y: 660, size: 9, font: bold, color: muted });
  page.drawText("E-mail", { x: 76, y: 610, size: 9, font: bold, color: muted });
  page.drawText("Plano", { x: 76, y: 560, size: 9, font: bold, color: muted });
  page.drawText("Aceito os termos de uso", { x: 240, y: 525, size: 10, font: regular, color: ink });

  const form = document.getForm();
  const name = form.createTextField("nome");
  name.addToPage(page, { x: 76, y: 630, width: 300, height: 24, borderColor: line, backgroundColor: paper });
  const email = form.createTextField("email");
  email.addToPage(page, { x: 76, y: 580, width: 300, height: 24, borderColor: line, backgroundColor: paper });
  const plan = form.createDropdown("plano");
  plan.addOptions(["Pessoal", "Profissional", "Educacional"]);
  plan.addToPage(page, { x: 76, y: 530, width: 140, height: 24, borderColor: line, backgroundColor: paper });
  const agree = form.createCheckBox("concordo");
  agree.addToPage(page, { x: 220, y: 528, width: 16, height: 16, borderColor: line, backgroundColor: paper });

  page.drawText("Este PDF é um exemplo. Nenhum dado é transmitido.", { x: 56, y: 430, size: 9, font: regular, color: muted });
  footer(page, 4);
}

// Page 5 — signature
{
  const page = document.addPage([width, height]);
  page.drawText("Assinatura visual", { x: 56, y: 760, size: 26, font: bold, color: ink });
  page.drawText("Desenhe ou digite uma assinatura na aba Editar e posicione sobre a linha.", { x: 56, y: 732, size: 11, font: regular, color: muted });
  textBlock(
    page,
    "Esta é uma assinatura visual, armazenada como imagem. Ela não cria uma assinatura digital certificada, não usa ICP-Brasil e não tem validade criptográfica. Para assinatura jurídica, use um provedor de confiança com certificado digital.",
    { x: 56, y: 690, size: 11, color: ink, maxWidth: 470 },
  );
  page.drawLine({ start: { x: 80, y: 430 }, end: { x: 430, y: 430 }, thickness: 1, color: ink });
  page.drawText("Assinatura", { x: 80, y: 414, size: 9, font: regular, color: muted });
  page.drawLine({ start: { x: 80, y: 360 }, end: { x: 300, y: 360 }, thickness: 0.8, color: line });
  page.drawText("Data", { x: 80, y: 344, size: 9, font: regular, color: muted });
  footer(page, 5);
}

// Page 6 — redaction demo
{
  const page = document.addPage([width, height]);
  page.drawText("Redação de conteúdo", { x: 56, y: 760, size: 26, font: bold, color: ink });
  page.drawText("Marque a área com a ferramenta Redigir. Ao aplicar, a página é rasterizada e o texto é removido.", { x: 56, y: 732, size: 11, font: regular, color: muted });
  page.drawRectangle({ x: 56, y: 500, width: 480, height: 160, color: soft, borderColor: line, borderWidth: 1 });
  page.drawText("DADOS SENSÍVEIS DE DEMONSTRAÇÃO", { x: 76, y: 630, size: 10, font: bold, color: rgb(0.6, 0.1, 0.15) });
  page.drawText("CPF: 000.000.000-00", { x: 76, y: 600, size: 12, font: mono, color: ink });
  page.drawText("Conta: 12345-6 · Agência: 0001", { x: 76, y: 575, size: 12, font: mono, color: ink });
  page.drawText("Chave: OPENPDF-DEMO-2026", { x: 76, y: 550, size: 12, font: mono, color: ink });
  page.drawText("Use a ferramenta Redigir sobre este bloco. O resultado não conterá o texto original.", { x: 76, y: 520, size: 9, font: regular, color: muted });
  textBlock(
    page,
    "A redação é irreversível: as páginas marcadas são rasterizadas e o conteúdo subjacente é descartado. Metadados também podem ser removidos. Diferente de um simples retângulo preto, o texto não permanece escondido no arquivo.",
    { x: 56, y: 460, size: 11, color: ink, maxWidth: 470 },
  );
  footer(page, 6);
}

const bytes = await document.save();
await writeFile(output, bytes);
console.log(`Sample written to ${output} (${bytes.length} bytes)`);
