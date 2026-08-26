import * as XLSX from "xlsx";
import { EXCEL_HEADERS } from "@/lib/excel/parse";

export function buildWorkbookBuffer(
  rows: Array<Record<string, unknown>>,
  headers: string[] = [...EXCEL_HEADERS],
): Buffer {
  const aoa: unknown[][] = [headers];
  for (const row of rows) {
    aoa.push(headers.map((h) => row[h] ?? null));
  }
  const sheet = XLSX.utils.aoa_to_sheet(aoa);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Users");
  return Buffer.from(XLSX.write(book, { type: "buffer", bookType: "xlsx" }));
}

export function buildEmptyWorkbookBuffer(): Buffer {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([]), "Empty");
  return Buffer.from(XLSX.write(book, { type: "buffer", bookType: "xlsx" }));
}
