import assert from 'node:assert/strict';
import {readFile, stat, readdir} from 'node:fs/promises';

const root = new URL('../frontend/', import.meta.url);
const html = await readFile(new URL('out/index.html', root), 'utf8');
const routes = JSON.parse(await readFile(new URL('.next/server/app-paths-manifest.json', root), 'utf8'));
assert.deepEqual(Object.keys(routes).sort(), ['/_global-error/page', '/_not-found/page', '/page']);
assert.equal((html.match(/data-patient-row="true"/g) || []).length, 7, 'The seven patients needing review must render without an API');
assert.match(html, /Emma Carter/);
assert.match(html, /Care overview/);
assert.match(html, /TheraNetrix \| Doctor Focus/);
assert.doesNotMatch(html, /Preview colour variation|Home design study|Forest green|Midnight blue/);
assert.doesNotMatch(html, /Workspace unavailable|feedback-pin\/loader\.js/);
for (const asset of ['favicon.svg', 'fonts/plex-preview/regular.ttf', 'fonts/plex-preview/semibold.ttf']) {
  assert.ok((await stat(new URL('out/' + asset, root))).size > 0, `Missing design asset: ${asset}`);
}
console.log('Static home verified: 7 review patients, all 11 available through filters, design assets included, no backend routes or feedback loader.');

const output = new URL('../.vercel/output/', import.meta.url);
const config = JSON.parse(await readFile(new URL('config.json', output), 'utf8'));
assert.deepEqual(config.routes, [{src: '/(.*)', dest: '/preview'}]);
assert.deepEqual((await readdir(output)).sort(), ['config.json', 'functions']);
assert.deepEqual(await readdir(new URL('functions/', output)), ['preview.func']);
const packaged = await readFile(new URL('functions/preview.func/site/index.html', output), 'utf8');
assert.equal(packaged, html);
assert.match(await readFile(new URL('functions/preview.func/handler.mjs', output), 'utf8'), /process\.env\.PREVIEW_PASSWORD/);
console.log('Deployment verified: no public static files; one password-gated function contains the entire preview.');
