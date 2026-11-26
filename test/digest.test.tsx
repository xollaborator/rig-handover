import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import type { RigConfig } from '../src/config.js';

const dir = mkdtempSync(join(tmpdir(), 'rig-digest-'));
const config: RigConfig = {
  adapter: 'shim',
  installed: '2026-10-29T14:06:00+01:00',
  beatEverySeconds: 60,
  runsDir: dir,
};

afterAll(() => rmSync(dir, { recursive: true, force: true }));

const real = [
  JSON.stringify({ at: '2026-10-28T02:05:00+01:00', job: 'backup', status: 'ok', owner: 'kim' }),
  JSON.stringify({ at: '2026-10-28T02:10:00+01:00', job: 'alpha', status: 'retry', owner: 'sam' }),
  JSON.stringify({ at: '2026-10-28T02:15:00+01:00', job: 'alpha', status: 'ok', owner: 'sam' }),
  'not json at all',
].join('\n');
writeFileSync(join(dir, '2026-10-28.jsonl'), real);
writeFileSync(join(dir, '2026-10-29.jsonl'), '\n');

describe('digest routes', () => {
  it('page renders a real night', async () => {
    const res = await createApp(config).request('/digest/2026-10-28');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('alpha');
    expect(html).toContain('backup');
  });

  it('json returns a real night', async () => {
    const res = await createApp(config).request('/api/digest/2026-10-28');
    expect(res.status).toBe(200);
    const rows = (await res.json()) as { job: string; runs: number }[];
    expect(rows.map((r) => r.job)).toEqual(['(unparsed)', 'alpha', 'backup']);
    expect(rows[1].runs).toBe(2);
  });

  it('404s for a night with no file', async () => {
    const app = createApp(config);
    expect((await app.request('/digest/2026-11-01')).status).toBe(404);
    const res = await app.request('/api/digest/2026-11-01');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'no log for that night' });
  });

  it('empty night renders "nothing ran" and an empty array', async () => {
    const app = createApp(config);
    const html = await (await app.request('/digest/2026-10-29')).text();
    expect(html).toContain('nothing ran');
    expect(await (await app.request('/api/digest/2026-10-29')).json()).toEqual([]);
  });

  it('bad line: page renders, unparsed counted', async () => {
    const html = await (await createApp(config).request('/digest/2026-10-28')).text();
    expect(html).toContain('(unparsed)');
    expect(html).toContain('<td>1</td>');
  });

  it('json job order equals the page row order', async () => {
    const app = createApp(config);
    const html = await (await app.request('/digest/2026-10-28')).text();
    const rows = (await (await app.request('/api/digest/2026-10-28')).json()) as {
      job: string;
    }[];
    const body = html.slice(html.indexOf('<table>'));
    const pageOrder = rows.map((r) => r.job);
    for (const job of pageOrder) {
      const i = body.indexOf(`<td>${job}</td>`);
      expect(i).toBeGreaterThanOrEqual(0);
      expect(i).toBeLessThan(body.indexOf('</table>'));
    }
    for (let k = 1; k < pageOrder.length; k++) {
      expect(body.indexOf(`<td>${pageOrder[k]}</td>`)).toBeGreaterThan(
        body.indexOf(`<td>${pageOrder[k - 1]}</td>`),
      );
    }
  });
});
