#!/usr/bin/env node
/**
 * Verifies the Hebrew and English i18n catalogs have the exact same set of keys.
 * Used as a Claude Code Stop hook (and runnable manually / in CI) so a string
 * added to one locale but not the other can't slip through.
 *
 * Exit codes:
 *   0  catalogs are in parity
 *   2  drift detected — prints the offending keys to stderr (a Stop hook treats
 *      exit 2 as "block + show stderr to the model" so it gets fixed)
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const load = (lng) =>
  JSON.parse(readFileSync(resolve(root, `src/locales/${lng}/translation.json`), 'utf8'));

let he, en;
try {
  he = load('he');
  en = load('en');
} catch (err) {
  console.error(`i18n parity check: could not read/parse a catalog — ${err.message}`);
  process.exit(2);
}

const heKeys = Object.keys(he);
const enKeys = Object.keys(en);
const missingInEn = heKeys.filter((k) => !(k in en));
const missingInHe = enKeys.filter((k) => !(k in he));

if (missingInEn.length || missingInHe.length) {
  console.error('i18n catalog parity FAILED — keep src/locales/{he,en}/translation.json in sync.');
  if (missingInEn.length) console.error(`  Missing in en (${missingInEn.length}): ${missingInEn.join(', ')}`);
  if (missingInHe.length) console.error(`  Missing in he (${missingInHe.length}): ${missingInHe.join(', ')}`);
  process.exit(2);
}

console.log(`i18n parity OK — ${heKeys.length} keys in both locales.`);
