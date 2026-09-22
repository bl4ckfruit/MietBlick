/**
 * Build für MietBlick.
 *
 * Erzeugt
 *   dist/                – statische App (index.html + assets)
 *   docs/                – identische Kopie, aus der GitHub Pages ausliefert
 *   MietBlick.html       – dieselbe App als einzelne Datei zum Doppelklicken
 *
 * Alle Pfade sind relativ, damit die App auch unter einem Unterpfad wie
 * https://name.github.io/mietblick/ funktioniert. Alles ist eingebettet:
 * keine CDN-Abhängigkeit, kein API-Key, offline lauffähig.
 */

import { build, context } from 'esbuild';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join } from 'node:path';
import { createReadStream, existsSync, statSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const DIST = join(ROOT, 'dist');
/** Wird mit ins Repository eingecheckt – GitHub Pages kann daraus direkt ausliefern. */
const DOCS = join(ROOT, 'docs');

const watch = process.argv.includes('--watch');
const serve = process.argv.includes('--serve');
const PORT = Number(process.env.PORT || 5173);

// Einfache Anführungszeichen, damit das Data-URI im href-Attribut nicht bricht.
const LOGO_SVG = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 112'><g fill='none' stroke-width='13' stroke-linecap='round' stroke-linejoin='round'><path d='M18 99V52L60 16' stroke='%2313283b'/><path d='M60 16l42 36v47' stroke='%233a9f75'/></g><circle cx='44' cy='67' r='10.5' fill='%2313283b'/><circle cx='47.6' cy='62.6' r='3.4' fill='%23fff'/><circle cx='76' cy='67' r='10.5' fill='%233a9f75'/><circle cx='79.6' cy='62.6' r='3.4' fill='%23fff'/></svg>`
  .replace(/</g, '%3C')
  .replace(/>/g, '%3E')
  .replace(/#/g, '%23');

function html({ css, js, inline, version }) {
  const suffix = version ? `?v=${version}` : '';
  const head = inline
    ? `<style>${css}</style>`
    : `<link rel="stylesheet" href="assets/app.css${suffix}" />`;
  const body = inline ? `<script>${js}</script>` : `<script src="assets/app.js${suffix}"></script>`;

  return `<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>MietBlick – Vermietungsassistent</title>
    <meta name="description" content="MietBlick – der digitale Vermietungsassistent für private Kleinvermieter. MVP-Demo." />
    <meta name="color-scheme" content="light" />
    <link rel="icon" href="data:image/svg+xml,${LOGO_SVG}" />
    ${head}
  </head>
  <body>
    <div id="root"></div>
    ${body}
  </body>
</html>
`;
}

const shared = {
  bundle: true,
  format: 'iife',
  target: ['es2020', 'chrome100', 'firefox100', 'safari15'],
  jsx: 'automatic',
  loader: { '.svg': 'dataurl' },
  logLevel: 'info',
  define: { 'process.env.NODE_ENV': '"production"' },
};

async function buildOnce() {
  await rm(DIST, { recursive: true, force: true });
  await mkdir(join(DIST, 'assets'), { recursive: true });

  const result = await build({
    ...shared,
    entryPoints: [join(ROOT, 'src/main.tsx')],
    outfile: join(DIST, 'assets/app.js'),
    minify: !watch,
    sourcemap: watch,
    metafile: true,
  });

  const css = await readFile(join(DIST, 'assets/app.css'), 'utf8');
  const js = await readFile(join(DIST, 'assets/app.js'), 'utf8');

  const version = Date.now().toString(36);
  await writeFile(join(DIST, 'index.html'), html({ css, js, inline: false, version }));
  await writeFile(join(ROOT, 'MietBlick.html'), html({ css, js, inline: true, version }));

  // Kopie für GitHub Pages. .nojekyll verhindert, dass Jekyll die Dateien anfasst.
  await rm(DOCS, { recursive: true, force: true });
  await cp(DIST, DOCS, { recursive: true });
  await writeFile(join(DOCS, '.nojekyll'), '');

  const bytes = Object.values(result.metafile.outputs).reduce((sum, o) => sum + o.bytes, 0);
  console.log(`\n✓ dist/, docs/ und MietBlick.html gebaut (${(bytes / 1024).toFixed(0)} kB)`);
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function startServer() {
  createServer((req, res) => {
    const url = decodeURIComponent((req.url || '/').split('?')[0]);
    let file = join(DIST, url === '/' ? 'index.html' : url);
    if (!existsSync(file) || statSync(file).isDirectory()) file = join(DIST, 'index.html');
    res.writeHead(200, {
      'Content-Type': MIME[extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    createReadStream(file).pipe(res);
  }).listen(PORT, () => {
    console.log(`\n→ MietBlick läuft auf http://localhost:${PORT}\n`);
  });
}

if (watch) {
  await mkdir(join(DIST, 'assets'), { recursive: true });
  const ctx = await context({
    ...shared,
    entryPoints: [join(ROOT, 'src/main.tsx')],
    outfile: join(DIST, 'assets/app.js'),
    sourcemap: true,
    plugins: [
      {
        name: 'html',
        setup(b) {
          b.onEnd(async () => {
            const css = await readFile(join(DIST, 'assets/app.css'), 'utf8').catch(() => '');
            await writeFile(join(DIST, 'index.html'), html({ css, js: '', inline: false }));
          });
        },
      },
    ],
  });
  await ctx.watch();
  if (serve) startServer();
} else {
  await buildOnce();
}
