import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readdirSync, existsSync, mkdtempSync, copyFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Source-parse smoke test for every implementation.
 *
 * WHY THIS EXISTS. Implementation B's round 1 scored 60/61 on the physics suite
 * while its website was completely dead: three of its twelve modules contained
 * single-character syntax errors and would not parse. The physics module itself
 * was flawless, so a physics-only gate reported success on an application that
 * could not start. Nothing in the suite noticed.
 *
 * Implementation B identified this gap itself, in §5 of its round-2 report, and
 * recommended exactly this test. It is adopted here.
 *
 * SCOPE, STATED HONESTLY. This proves only that each file is syntactically
 * valid JavaScript. It does not prove the modules import each other correctly,
 * that the page renders, or that anything is interactive — a module can parse
 * perfectly and still throw on first execution. Browser verification remains a
 * manual step (PLAN §7.5); adding it here would mean taking on a browser
 * automation dependency, and the project ships with none.
 *
 * Zero dependencies: this shells out to `node --check`, which is Node's own
 * parser. Files are copied to a temporary `.mjs` so they are parsed as ES
 * modules regardless of how the checking process resolves `package.json`.
 */

const here = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = join(here, '..');

/** Every implementation directory that actually exists. */
function implementations() {
  return readdirSync(repoRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory() && /^impl-/.test(e.name))
    .map((e) => e.name)
    .filter((name) => existsSync(join(repoRoot, name, 'js')))
    .sort();
}

function parses(filePath) {
  const dir = mkdtempSync(join(tmpdir(), 'parse-'));
  try {
    const target = join(dir, `${basename(filePath, '.js')}.mjs`);
    copyFileSync(filePath, target);
    execFileSync(process.execPath, ['--check', target], { stdio: 'pipe' });
    return { ok: true, error: null };
  } catch (err) {
    const stderr = String(err.stderr ?? err.message ?? '');
    const line = stderr.split('\n').find((l) => /Error/.test(l)) ?? stderr.slice(0, 200);
    return { ok: false, error: line.trim() };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const impls = implementations();

test('at least one implementation directory is present', () => {
  assert.ok(impls.length > 0, 'no impl-*/js directories found');
});

for (const impl of impls) {
  test(`${impl}: every JavaScript module parses`, () => {
    const dir = join(repoRoot, impl, 'js');
    const files = readdirSync(dir).filter((f) => f.endsWith('.js')).sort();
    assert.ok(files.length > 0, `${impl}/js contains no .js files`);

    const broken = [];
    for (const f of files) {
      const res = parses(join(dir, f));
      if (!res.ok) broken.push(`${impl}/js/${f} — ${res.error}`);
    }

    assert.deepEqual(
      broken,
      [],
      `${broken.length} of ${files.length} modules do not parse:\n  ${broken.join('\n  ')}`,
    );
  });
}

test('the parse check can actually fail (guard against a vacuous smoke test)', () => {
  // A smoke test that cannot fail is worse than no smoke test: it reports
  // green forever. Feed the checker a file with the exact defect that shipped
  // in implementation B round 1 — an unterminated string literal — and assert
  // that it is caught.
  const dir = mkdtempSync(join(tmpdir(), 'parse-neg-'));
  try {
    const bad = join(dir, 'deliberately-broken.js');
    writeFileSync(bad, 'export const k = (e) => e.key === "ArrowLeft;\n', 'utf8');
    const res = parses(bad);
    assert.equal(res.ok, false, 'an unterminated string literal was not detected');
    assert.match(res.error ?? '', /Error/);

    // And the other round-1 defect: a stray closing brace.
    const bad2 = join(dir, 'extra-brace.js');
    writeFileSync(bad2, 'export function f() { return 1; }}\n', 'utf8');
    assert.equal(parses(bad2).ok, false, 'an extra closing brace was not detected');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
