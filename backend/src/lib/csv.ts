import type { Response } from "express";

// Eksport CSV pod polskiego Excela: UTF-8 z BOM + średnik jako separator
// (Excel z polskim locale inaczej wsadza wszystko do jednej kolumny).
const SEP = ";";
const BOM = "\uFEFF";

function cell(value: unknown): string {
  if (value == null) return "";
  let s = String(value);
  // ochrona przed formula injection w Excelu
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  if (s.includes(SEP) || s.includes('"') || s.includes("\n")) {
    s = '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export function sendCsv(
  res: Response,
  filename: string,
  header: string[],
  rows: unknown[][],
): void {
  const lines = [header.map(cell).join(SEP), ...rows.map((r) => r.map(cell).join(SEP))];
  res.set("Content-Type", "text/csv; charset=utf-8");
  res.set("Content-Disposition", `attachment; filename="${filename}"`);
  res.set("Cache-Control", "no-store");
  res.send(BOM + lines.join("\r\n"));
}
