import { describe, expect, it } from "vitest";
import { readNight } from "./reader.js";
import { UNPARSED_JOB } from "./types.js";

describe("readNight", () => {
  const rows = readNight("runs", "2026-10-28");

  it("keeps one row per job, plus one for the bad line", () => {
    const jobs = rows.map((r) => r.job).filter((j) => j !== UNPARSED_JOB);
    expect(jobs.sort()).toEqual([
      "digest/render",
      "fixtures/refresh",
      "lane/sync",
      "notes/backup",
      "rig/rotate-logs",
    ]);
  });

  it("counts the unparseable line in the sentinel row", () => {
    const bad = rows.find((r) => r.job === UNPARSED_JOB);
    expect(bad?.runs).toBe(1);
  });

  it("folds a job's runs, retries and last state", () => {
    const sync = rows.find((r) => r.job === "lane/sync");
    expect(sync).toMatchObject({
      owner: "rook",
      runs: 8,
      retries: 1,
      lastStatus: "ok",
      lastError: "lock held",
      firstAt: "2026-10-28T23:00:06+01:00",
      lastAt: "2026-10-29T05:00:04+01:00",
    });
  });

  it("keeps a null owner as null", () => {
    const render = rows.find((r) => r.job === "digest/render");
    expect(render?.owner).toBeNull();
  });

  it("keeps the last error of a failed job", () => {
    const backup = rows.find((r) => r.job === "notes/backup");
    expect(backup).toMatchObject({ runs: 1, retries: 0, lastStatus: "fail", lastError: "quota exceeded" });
  });
});
