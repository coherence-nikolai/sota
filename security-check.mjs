import { readFileSync } from 'node:fs';

const files = [
  'index.html',
  'privacy.html',
  'js/agents.js',
  'js/api.js',
  'js/app.js',
  'js/compass.js',
  'js/providers.js',
  'js/sit.js',
  'js/storage.js',
  'js/tracker.js',
];

function read(path) {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
}

function assert(condition, message) {
  if (!condition) {
    console.error(`security-check failed: ${message}`);
    process.exit(1);
  }
}

const combined = files.map(read).join('\n');
assert(!/dark night|Dark Night|Dark night/.test(combined), 'user-facing dark night phrasing remains');

const tracker = read('js/tracker.js');
const exportBlock = tracker.match(/function exportLog\(\)[\s\S]*?async function runInsights/)?.[0] || '';
assert(exportBlock && !/ApiKey|api_key|sota_api_keys/i.test(exportBlock), 'practice export may include API key data');

const api = read('js/api.js');
assert(api.includes('assertAllowedEndpoint'), 'provider endpoint allow-list is not enforced');
assert(api.includes('sanitizeError'), 'API errors are not sanitized');

const storage = read('js/storage.js');
assert(storage.includes('legacy-anthropic-key'), 'legacy Anthropic key migration is missing');

console.log('security-check passed');
