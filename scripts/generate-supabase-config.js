/*
 * (Re)writes supabase-config.js from Supabase credentials. Use this when
 * provisioning a new Supabase project or rotating the key — the committed
 * supabase-config.js already works for normal clones.
 *
 * Credential sources, in order of precedence:
 *   1. Environment variables SUPABASE_URL / SUPABASE_ANON_KEY
 *   2. A local ".env" file in the project root (git-ignored)
 *
 * Run:  node scripts/generate-supabase-config.js
 *
 * If no credentials are found, an existing supabase-config.js is left untouched;
 * only if none exists is an empty one written (short links off, long URLs work).
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

// --- 1. read a local .env file if present (very small parser, no dependency) ---
function readDotEnv(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

const dotenv = readDotEnv(path.join(root, '.env'));

const PLACEHOLDERS = new Set(['', 'your_supabase_project_url', 'your_supabase_anon_key']);
function pick(name) {
  const v = process.env[name] || dotenv[name] || '';
  return PLACEHOLDERS.has(v) ? '' : v;
}

const url = pick('SUPABASE_URL');
const anonKey = pick('SUPABASE_ANON_KEY');

const outPath = path.join(root, 'supabase-config.js');

if (!url || !anonKey) {
  // No credentials from env or .env. Don't clobber a committed supabase-config.js.
  if (fs.existsSync(outPath)) {
    console.log('No SUPABASE_URL/SUPABASE_ANON_KEY provided; keeping existing supabase-config.js.');
  } else {
    fs.writeFileSync(outPath, 'window.SUPABASE_URL = "";\nwindow.SUPABASE_ANON_KEY = "";\n');
    console.log('supabase-config.js written empty (short share links disabled; legacy URLs still work).');
  }
} else {
  fs.writeFileSync(
    outPath,
    `window.SUPABASE_URL = ${JSON.stringify(url)};\n` +
    `window.SUPABASE_ANON_KEY = ${JSON.stringify(anonKey)};\n`
  );
  console.log(`supabase-config.js written (SUPABASE_URL = ${url}).`);
}
