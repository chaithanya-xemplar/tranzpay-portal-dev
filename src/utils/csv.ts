// src/utils/csv.ts

/**
 * CSV assembly for table exports.
 *
 * This module only ever sees strings the caller has already formatted — it
 * never touches a row object, so masking stays the responsibility of the
 * column that renders the value and cannot be bypassed here. Nothing in this
 * file logs.
 */

/** Excel reads a UTF-8 file as the system codepage unless it finds a BOM. */
const BOM = "﻿";

/**
 * Leading `= + - @` makes Excel and Sheets treat a cell as a formula, so a
 * value out of the database could execute on open. Prefixing an apostrophe
 * forces it back to text — the standard CSV-injection defence.
 */
const RISKY_PREFIX = /^[=+\-@]/;

const escapeCell = (value: string): string => {
  const safe = RISKY_PREFIX.test(value) ? `'${value}` : value;

  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

/** RFC 4180 text, CRLF line endings, no trailing newline. */
export const toCsvContent = (
  headers: string[],
  rows: string[][]
): string =>
  [headers, ...rows].map((row) => row.map(escapeCell).join(",")).join("\r\n");

export const toCsvBlob = (headers: string[], rows: string[][]): Blob =>
  new Blob([BOM, toCsvContent(headers, rows)], {
    type: "text/csv;charset=utf-8;",
  });

/**
 * Renders one cell for the file. Objects are JSON so a nested payload still
 * lands in a single column; nullish and empty values become an empty cell
 * rather than the table's "-" placeholder, which would be noise in a
 * spreadsheet.
 */
export const stringifyCellValue = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};
