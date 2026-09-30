/**
 * LUMIARDI — Verificação de i18n
 *
 * Uso: node scripts/check-i18n.js [--orphans]
 *
 * - Paridade de chaves entre pt/en/es/fr/it/ru (dicionário base + módulos + checkout)
 * - Valores vazios
 * - Chaves usadas em t('...') / tApiError(..., '...') inexistentes no dicionário
 * - (--orphans) chaves definidas que não aparecem em nenhum arquivo de src/
 *
 * Sai com código 1 se houver chave faltando ou quebrada.
 */
const fs = require('fs');
const path = require('path');
const Module = require('module');
const ts = require('typescript');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const LANGS = ['pt', 'en', 'es', 'fr', 'it', 'ru'];

// Carrega arquivos .ts transpilados em memória (sem gerar arquivos)
require.extensions['.ts'] = function (module, filename) {
  const source = fs.readFileSync(filename, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    fileName: filename,
  });
  module._compile(outputText, filename);
};
const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  if (request.startsWith('@/')) request = path.join(SRC, request.slice(2));
  return origResolve.call(this, request, parent, ...rest);
};

const { translations, CHECKOUT_TRANSLATIONS } = require(path.join(SRC, 'locales', 'index.ts'));

let failed = false;
const report = (msg) => console.log(msg);

function checkParity(label, dicts) {
  const union = new Set();
  for (const l of LANGS) Object.keys(dicts[l] || {}).forEach((k) => union.add(k));
  report(`\n[${label}] ${union.size} chaves`);
  for (const l of LANGS) {
    const d = dicts[l] || {};
    const missing = [...union].filter((k) => !(k in d));
    const empty = Object.entries(d).filter(([, v]) => typeof v !== 'string' || v.trim() === '').map(([k]) => k);
    if (missing.length || empty.length) {
      failed = true;
      report(`  ✗ ${l}: ${missing.length} faltando, ${empty.length} vazias`);
      missing.slice(0, 20).forEach((k) => report(`      - faltando: ${k}`));
      empty.slice(0, 20).forEach((k) => report(`      - vazia: ${k}`));
    } else {
      report(`  ✓ ${l}`);
    }
  }
  return union;
}

const mainKeys = checkParity('dicionário + módulos', translations);
const checkoutKeys = checkParity('checkout', CHECKOUT_TRANSLATIONS);
const allKeys = new Set([...mainKeys, ...checkoutKeys]);

// Varredura de uso no código
function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (full.startsWith(path.join(SRC, 'locales'))) continue;
      walk(full, out);
    } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

const files = walk(SRC);
const usageRe = /\b(?:t|tApiError)\(\s*(?:[^,()'"`]+,\s*)?['"]([A-Za-z0-9_.-]+)['"]/g;
const broken = [];
const corpus = [];
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  corpus.push(src);
  let m;
  while ((m = usageRe.exec(src))) {
    if (!allKeys.has(m[1])) broken.push(`${path.relative(ROOT, f)}: ${m[1]}`);
  }
}
if (broken.length) {
  failed = true;
  report(`\n✗ ${broken.length} chaves usadas no código e inexistentes:`);
  broken.forEach((b) => report(`  - ${b}`));
} else {
  report('\n✓ Nenhuma chave quebrada no código');
}

if (process.argv.includes('--orphans')) {
  const text = corpus.join('\n');
  const orphans = [...mainKeys].filter((k) => !text.includes(k) && !k.startsWith('api_err_'));
  report(`\n${orphans.length} chaves órfãs (não aparecem em src/):`);
  orphans.forEach((k) => report(`  - ${k}`));
}

process.exit(failed ? 1 : 0);
