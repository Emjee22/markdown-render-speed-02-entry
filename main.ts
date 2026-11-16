// main.ts — driver for the markdown-render-speed-02 entry.
// Reads <inputDir>/cases.json, renders each case with parse, writes
// <outputDir>/html.json (a JSON array of HTML strings, in case order).
// Node 22, standard library only. No network, no caching across cases:
// parse is called once per case, in order, and the result is written out.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { parse } from './parse.js';

const inputDir = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const raw = JSON.parse(readFileSync(inputDir + '/cases.json', 'utf8'));
const cases: unknown[] = Array.isArray(raw) ? raw : raw.cases;
const out: string[] = [];
for (const c of cases) {
  const md = typeof c === 'string' ? c : (c as { markdown: string }).markdown;
  out.push(parse(md));
}
mkdirSync(outputDir, { recursive: true });
writeFileSync(outputDir + '/html.json', JSON.stringify(out));
