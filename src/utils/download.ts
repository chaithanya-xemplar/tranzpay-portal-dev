// src/utils/download.ts

/**
 * Browser file-save helpers for table exports.
 *
 * Nothing here inspects or assembles row data — it takes a finished blob — so
 * no account value passes through this module.
 */

/** `corp-account-list_2026-09-21.csv` — slug of the table title plus the day. */
export const buildExportFilename = (
  title: string,
  extension: string,
  today: Date = new Date()
): string => {
  const slug =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "export";

  const stamp = today.toISOString().slice(0, 10);

  return `${slug}_${stamp}.${extension}`;
};

/** Saves a blob under `filename`, cleaning up the object URL afterwards. */
export const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
};
