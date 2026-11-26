import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DigestRow, UNPARSED_JOB } from "./types.js";

interface LogLine {
  at: string;
  job: string;
  status: "ok" | "retry" | "fail";
  owner?: string | null;
  error?: string;
}

function parseLine(line: string): LogLine | null {
  try {
    const raw: unknown = JSON.parse(line);
    if (typeof raw !== "object" || raw === null) return null;
    const o = raw as Record<string, unknown>;
    if (typeof o.at !== "string" || typeof o.job !== "string") return null;
    if (o.status !== "ok" && o.status !== "retry" && o.status !== "fail") return null;
    if (o.owner !== undefined && o.owner !== null && typeof o.owner !== "string") return null;
    if (o.error !== undefined && typeof o.error !== "string") return null;
    return {
      at: o.at,
      job: o.job,
      status: o.status,
      owner: o.owner ?? null,
      error: o.error,
    };
  } catch {
    return null;
  }
}

/** Read `runs/<night>.jsonl` and fold it into one row per job. */
export function readNight(runsDir: string, night: string): DigestRow[] {
  const text = readFileSync(join(runsDir, `${night}.jsonl`), "utf8");
  const byJob = new Map<string, DigestRow>();
  const unparsed: DigestRow = {
    job: UNPARSED_JOB,
    owner: null,
    runs: 0,
    retries: 0,
    lastStatus: "ok",
    lastError: null,
    firstAt: "",
    lastAt: "",
  };

  for (const line of text.split("\n")) {
    if (line.trim() === "") continue;
    const entry = parseLine(line);
    if (entry === null) {
      unparsed.runs += 1;
      continue;
    }
    const existing = byJob.get(entry.job);
    const row: DigestRow =
      existing ??
      {
        job: entry.job,
        owner: entry.owner ?? null,
        runs: 0,
        retries: 0,
        lastStatus: entry.status,
        lastError: entry.error ?? null,
        firstAt: entry.at,
        lastAt: entry.at,
      };
    if (existing === undefined) byJob.set(entry.job, row);
    row.runs += 1;
    if (entry.status === "retry") row.retries += 1;
    row.owner = entry.owner ?? null;
    row.lastStatus = entry.status;
    if (entry.error !== undefined) row.lastError = entry.error;
    row.lastAt = entry.at;
  }

  const rows = [...byJob.values()];
  return unparsed.runs > 0 ? [...rows, unparsed] : rows;
}
