/**
 * One digest row: everything the night said about a single job.
 *
 * Unparseable log lines carry no `job`, so they cannot join a real job's row.
 * They are counted instead, in a single sentinel row per night whose `job` is
 * `UNPARSED_JOB` (`runs` = number of bad lines, all other fields unset).
 * The night still renders; tests assert the count on that row.
 */
export const UNPARSED_JOB = "(unparsed)";

export interface DigestRow {
  /** Job name from the log, or UNPARSED_JOB for the bad-line count. */
  job: string;
  /** Owner of the last run; null when the log had none. Rendered as —. */
  owner: string | null;
  /** Log lines seen for this job, including retries and bad-owner lines. */
  runs: number;
  /** Lines with status "retry". */
  retries: number;
  /** Status of the job's last line: "ok" | "retry" | "fail". */
  lastStatus: "ok" | "retry" | "fail";
  /** `error` of the job's last line that had one, else null. */
  lastError: string | null;
  /** `at` of the job's first line, offset as logged. */
  firstAt: string;
  /** `at` of the job's last line, offset as logged. */
  lastAt: string;
}

/** Read `runs/<night>.jsonl` and fold it into one row per job. */
export function readNight(runsDir: string, night: string): DigestRow[] {
  return [];
}
