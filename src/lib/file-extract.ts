// Worker-safe file text extraction (PDF / CSV / TXT / OFX / XLSX)
import { extractText, getDocumentProxy } from "unpdf";
import * as XLSX from "xlsx";

export async function extractFileText(file: {
  name: string;
  type: string;
  data: ArrayBuffer;
}): Promise<string> {
  const lower = file.name.toLowerCase();
  const mime = (file.type || "").toLowerCase();

  // PDF
  if (lower.endsWith(".pdf") || mime.includes("pdf")) {
    const pdf = await getDocumentProxy(new Uint8Array(file.data));
    const { text } = await extractText(pdf, { mergePages: true });
    return Array.isArray(text) ? text.join("\n") : text;
  }

  // XLSX / XLS
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls") || mime.includes("spreadsheet")) {
    const wb = XLSX.read(new Uint8Array(file.data), { type: "array" });
    const out: string[] = [];
    for (const name of wb.SheetNames) {
      const sheet = wb.Sheets[name];
      out.push(`# Sheet: ${name}\n${XLSX.utils.sheet_to_csv(sheet)}`);
    }
    return out.join("\n\n");
  }

  // TXT / CSV / OFX → decode UTF-8
  const dec = new TextDecoder("utf-8", { fatal: false });
  return dec.decode(new Uint8Array(file.data));
}