// L1 linter self-test (tranche 1 deliverable).
//
// 1. Dirty fixture: every planted violation must be caught, and the four
//    sanctioned look-alike forms must NOT be flagged.
// 2. spyne-todos specimen: expected fully CLEAN. (The two legacy el$.toggle
//    usages found in tranche 1 were fixed specimen-side — el$.toggle →
//    toggleClass at todo-traits.js:43/50 — so the expectation is now zero.)

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lintDir } from './l1-linter.js';

const here = path.dirname(fileURLToPath(import.meta.url));

// Clean-corpus control: point at any known-clean SpyneJS app source tree.
// (The original run used a local sample app; path parameterized for publication.)
const TODOS_SRC = process.env.CLEAN_SRC || null;
const DIRTY = path.join(here, 'fixtures/dirty');

// checkId -> expected count in the dirty fixture
const EXPECTED_DIRTY = {
  'registry:sendCachedPayload': 1,
  'registry:addChannel': 1,
  'registry:el$-toggle': 2,
  'registry:template-dot-star': 1,
  'registry:string-channels': 1,
  'registry:non-array-traits': 1,
  'registry:propFilters': 1,
  'registry:viewstream-getChannel': 1,
  'addEventListener': 1,
  'constants-file': 1,
  'viewstream-extra-method': 1,
  'regex-specials-in-label': 1,
  'nested-payload-key': 1,
};

// Specimen is expected fully clean (legacy el$.toggle pair fixed post-tranche-1)
const KNOWN_SPECIMEN = {};

function tally(violations) {
  const t = {};
  for (const v of violations) t[v.checkId] = (t[v.checkId] || 0) + 1;
  return t;
}

function diff(expected, actual) {
  const problems = [];
  for (const [k, n] of Object.entries(expected)) {
    if ((actual[k] || 0) !== n) problems.push(`${k}: expected ${n}, got ${actual[k] || 0}`);
  }
  for (const k of Object.keys(actual)) {
    if (!(k in expected)) problems.push(`${k}: unexpected ${actual[k]} hit(s)`);
  }
  return problems;
}

let failed = false;

// --- dirty fixture
const dirty = lintDir(DIRTY);
const dirtyProblems = diff(EXPECTED_DIRTY, tally(dirty.violations));
console.log(`\n== dirty fixture: ${dirty.violations.length} violations, l1Score=${dirty.l1Score}`);
if (dirtyProblems.length) {
  failed = true;
  console.log('FAIL:');
  for (const p of dirtyProblems) console.log('  - ' + p);
  for (const v of dirty.violations) console.log(`    ${v.checkId} ${v.file}:${v.line} ${v.excerpt}`);
} else {
  console.log('PASS: all planted violations caught; no sanctioned form flagged');
}

// --- todos specimen
if (TODOS_SRC) {
  const todos = lintDir(TODOS_SRC);
  const todosProblems = diff(KNOWN_SPECIMEN, tally(todos.violations));
  console.log(`\n== clean-corpus specimen: ${todos.violations.length} violations, l1Score=${todos.l1Score}`);
  for (const v of todos.violations) console.log(`    ${v.checkId} ${v.file}:${v.line}  ${v.excerpt}`);
  if (todosProblems.length) {
    failed = true;
    console.log('FAIL (specimen expected fully clean):');
    for (const p of todosProblems) console.log('  - ' + p);
  } else {
    console.log('PASS: specimen fully clean (zero violations)');
  }
} else {
  console.log('\n(clean-corpus specimen skipped: set CLEAN_SRC to a known-clean SpyneJS src tree)');
}

process.exit(failed ? 1 : 0);
