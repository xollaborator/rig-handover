import { Hono } from 'hono';
import { loadConfig, type RigConfig } from './config.js';
import { lane } from './lane.js';
import { readStatus } from './status.js';
import { readNight } from './digest/reader.js';
import { sortedRows } from './digest/rows.js';
import { Layout } from './views/layout.js';
import { StatusBoard } from './views/status.js';
import { DigestBoard } from './views/digest.js';

export function createApp(config: RigConfig = loadConfig()) {
  const app = new Hono();

  app.get('/health', (c) => c.json({ ok: true, lane: lane().id }));

  app.get('/', (c) =>
    c.html(
      <Layout title="status" lane={lane()}>
        <StatusBoard status={readStatus(config)} />
      </Layout>,
    ),
  );

  const nightRows = (night: string) => {
    try {
      return sortedRows(readNight(config.runsDir, night));
    } catch {
      return null;
    }
  };

  app.get('/digest/:night', (c) => {
    const rows = nightRows(c.req.param('night'));
    if (rows === null) return c.text('no log for that night', 404);
    return c.html(
      <Layout title={`digest · ${c.req.param('night')}`} lane={lane()}>
        <DigestBoard rows={rows} />
      </Layout>,
    );
  });

  app.get('/api/digest/:night', (c) => {
    const rows = nightRows(c.req.param('night'));
    if (rows === null) return c.json({ error: 'no log for that night' }, 404);
    return c.json(rows);
  });

  return app;
}
