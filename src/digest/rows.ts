import type { DigestRow } from "./types.js";

/** Rows sorted by job — the one order both the page and the JSON use (ADR 0001). */
export function sortedRows(rows: DigestRow[]): DigestRow[] {
  return [...rows].sort((a, b) => a.job.localeCompare(b.job));
}
