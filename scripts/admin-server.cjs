/**
 * Daily Mission Academy — local Content Control Panel server.
 *
 * This is a DEV-ONLY tool. It is never deployed to GitHub Pages — it just
 * runs on your own computer (via `npm run admin`), serves a small form UI,
 * and when you click Save/Publish it:
 *   1. writes the assignment into the right public/content/*.json file
 *   2. updates public/content/manifest.json if needed
 *   3. runs git add / commit / push
 *   4. runs `npm run deploy` to publish the live site
 *
 * No data ever leaves your machine except the git push you already do
 * manually today — this just automates the same steps.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'public', 'content');
const MANIFEST_PATH = path.join(CONTENT_DIR, 'manifest.json');
const ADMIN_HTML_PATH = path.join(__dirname, '..', 'admin', 'index.html');
const PORT = process.env.PORT ? Number(process.env.PORT) : 5050;

const VALID_CHILDREN = ['iraj', 'aveer'];

// ---------------------------------------------------------------------------
// small helpers
// ---------------------------------------------------------------------------

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  const raw = fs.readFileSync(filePath, 'utf-8');
  if (!raw.trim()) return fallback;
  return JSON.parse(raw);
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

function sendJson(res, statusCode, body) {
  const payload = JSON.stringify(body);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 5_000_000) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function assertValidChild(childId) {
  if (!VALID_CHILDREN.includes(childId)) {
    throw new Error(`Unknown child "${childId}". Expected one of: ${VALID_CHILDREN.join(', ')}`);
  }
}

function assertSafeFileName(file) {
  if (!/^[a-zA-Z0-9_-]+\.json$/.test(file)) {
    throw new Error(`Invalid file name "${file}". Use letters, numbers, "-" or "_", ending in .json`);
  }
}

function run(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] });
}

// ---------------------------------------------------------------------------
// API handlers
// ---------------------------------------------------------------------------

function handleGetManifest(res) {
  const manifest = readJson(MANIFEST_PATH, { version: '', children: {} });
  sendJson(res, 200, manifest);
}

function handleGetContent(res, query) {
  const childId = query.get('child');
  const file = query.get('file');
  assertValidChild(childId);
  assertSafeFileName(file);

  const filePath = path.join(CONTENT_DIR, childId, file);
  const days = readJson(filePath, []);
  sendJson(res, 200, { days });
}

function upsertAssignment(filePath, assignment) {
  const days = readJson(filePath, []);
  const index = days.findIndex((d) => d.id === assignment.id);
  if (index >= 0) {
    days[index] = assignment;
  } else {
    days.push(assignment);
  }
  days.sort((a, b) => a.dayNumber - b.dayNumber);
  writeJson(filePath, days);
  return days;
}

function ensureManifestEntry(manifest, childId, file, setAsCurrentWeek) {
  if (!manifest.children) manifest.children = {};
  if (!manifest.children[childId]) {
    manifest.children[childId] = { currentWeek: file.replace(/\.json$/, ''), files: [] };
  }
  const entry = manifest.children[childId];
  if (!entry.files.includes(file)) {
    entry.files.push(file);
  }
  if (setAsCurrentWeek) {
    entry.currentWeek = file.replace(/\.json$/, '');
  }
  manifest.version = new Date().toISOString().slice(0, 10);
  return manifest;
}

async function handleSaveDay(req, res) {
  const body = JSON.parse(await readRequestBody(req));
  const { child: childId, file, assignment, setAsCurrentWeek } = body;

  assertValidChild(childId);
  assertSafeFileName(file);

  if (!assignment || !assignment.id || !assignment.dayNumber || !assignment.title) {
    throw new Error('Assignment is missing required fields (id, dayNumber, title).');
  }

  const filePath = path.join(CONTENT_DIR, childId, file);
  const days = upsertAssignment(filePath, assignment);

  const manifest = readJson(MANIFEST_PATH, { version: '', children: {} });
  ensureManifestEntry(manifest, childId, file, Boolean(setAsCurrentWeek));
  writeJson(MANIFEST_PATH, manifest);

  sendJson(res, 200, { ok: true, days, manifest });
}

async function handlePublish(req, res) {
  const body = JSON.parse(await readRequestBody(req));
  const message = (body.message || 'Update content via Control Panel').trim();
  const safeMessage = message.replace(/"/g, '\\"');

  const log = [];

  try {
    log.push('$ git add -A');
    log.push(run('git add -A'));
  } catch (err) {
    log.push(String(err.stdout || err.message));
  }

  try {
    log.push(`$ git commit -m "${safeMessage}"`);
    log.push(run(`git commit -m "${safeMessage}"`));
  } catch (err) {
    // Commit fails (non-fatal) if there's nothing new to commit.
    log.push('(nothing to commit, or commit skipped)');
    log.push(String(err.stdout || err.message));
  }

  try {
    log.push('$ git push');
    log.push(run('git push'));
  } catch (err) {
    log.push(String(err.stderr || err.message));
    sendJson(res, 500, { ok: false, log: log.join('\n'), error: 'git push failed — see log.' });
    return;
  }

  try {
    log.push('$ npm run deploy');
    log.push(run('npm run deploy'));
  } catch (err) {
    log.push(String(err.stderr || err.message));
    sendJson(res, 500, { ok: false, log: log.join('\n'), error: 'npm run deploy failed — see log.' });
    return;
  }

  sendJson(res, 200, { ok: true, log: log.join('\n') });
}

// ---------------------------------------------------------------------------
// static file serving for the admin page
// ---------------------------------------------------------------------------

function serveAdminPage(res) {
  fs.readFile(ADMIN_HTML_PATH, 'utf-8', (err, html) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Could not load admin/index.html: ' + err.message);
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  });
}

// ---------------------------------------------------------------------------
// router
// ---------------------------------------------------------------------------

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  try {
    if (req.method === 'GET' && url.pathname === '/') {
      serveAdminPage(res);
      return;
    }
    if (req.method === 'GET' && url.pathname === '/api/manifest') {
      handleGetManifest(res);
      return;
    }
    if (req.method === 'GET' && url.pathname === '/api/content') {
      handleGetContent(res, url.searchParams);
      return;
    }
    if (req.method === 'POST' && url.pathname === '/api/save-day') {
      await handleSaveDay(req, res);
      return;
    }
    if (req.method === 'POST' && url.pathname === '/api/publish') {
      await handlePublish(req, res);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  } catch (err) {
    sendJson(res, 400, { ok: false, error: err instanceof Error ? err.message : String(err) });
  }
});

server.listen(PORT, () => {
  console.log('');
  console.log('  Daily Mission Academy — Content Control Panel');
  console.log(`  Open this in your browser:  http://localhost:${PORT}`);
  console.log('  Press Ctrl+C to stop.');
  console.log('');
});
