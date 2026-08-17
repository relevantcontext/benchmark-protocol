// L1 mechanical linter — pure static checks over generated SpyneJS files.
//
// Per benchmark-system-spec.md §2 and the registry in 02-operations-set.md
// (op:recognize-never-emit). Regex + light parsing by design: each check
// documents its false-positive / false-negative surface inline. No AST.
//
// Output: { violations: [{ checkId, opId, file, line, excerpt }], l1Score }
// l1Score: 100 minus weighted deductions, floored at 0. Registry forms weigh
// heaviest (15 each); all other checks 8 each.

import fs from 'node:fs';
import path from 'node:path';

const REGISTRY_WEIGHT = 15;
const OTHER_WEIGHT = 8;

// The four sanctioned members of a ViewStream class surface
// (op:wiring-surface-only-on-viewstream).
const VIEWSTREAM_SURFACE = new Set([
  'constructor',
  'broadcastEvents',
  'addActionListeners',
  'onRendered',
]);

const LINTABLE_EXT = new Set(['.js', '.mjs', '.cjs', '.html', '.json']);

// ---------------------------------------------------------------------------
// helpers

function* iterLines(text) {
  let line = 1;
  let start = 0;
  for (let i = 0; i <= text.length; i++) {
    if (i === text.length || text[i] === '\n') {
      yield { line, text: text.slice(start, i) };
      start = i + 1;
      line++;
    }
  }
}

function lineOfIndex(text, index) {
  let line = 1;
  for (let i = 0; i < index && i < text.length; i++) {
    if (text[i] === '\n') line++;
  }
  return line;
}

function excerptAt(text, index, span = 80) {
  const lineStart = text.lastIndexOf('\n', index) + 1;
  let lineEnd = text.indexOf('\n', index);
  if (lineEnd === -1) lineEnd = text.length;
  return text.slice(lineStart, Math.min(lineEnd, lineStart + span)).trim();
}

// Finds the text span of a balanced (...) or {...} group starting at openIdx.
// FN surface: unbalanced braces inside string literals containing { } ( )
// can truncate or extend the span; acceptable for lint-grade scanning.
function balancedSpan(text, openIdx, open, close) {
  let depth = 0;
  for (let i = openIdx; i < text.length; i++) {
    const ch = text[i];
    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return text.slice(openIdx, i + 1);
    }
  }
  return text.slice(openIdx); // unbalanced: rest of file
}

// ---------------------------------------------------------------------------
// checks — each returns [{checkId, opId, weight, index|line, excerpt}]

const CHECKS = [];

function regexCheck({ checkId, opId, weight, pattern, ext, note }) {
  CHECKS.push({
    checkId,
    opId,
    note,
    run(file, text) {
      if (ext && !ext.includes(path.extname(file))) return [];
      const out = [];
      const re = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
      let m;
      while ((m = re.exec(text)) !== null) {
        out.push({
          checkId,
          opId,
          weight,
          line: lineOfIndex(text, m.index),
          excerpt: excerptAt(text, m.index),
        });
        if (m.index === re.lastIndex) re.lastIndex++;
      }
      return out;
    },
  });
}

// --- registry forms (op:recognize-never-emit unless a more specific op owns it)

// 1. sendCachedPayload → replay. FP: none known (name is unique to the alias).
regexCheck({
  checkId: 'registry:sendCachedPayload',
  opId: 'recognize-never-emit',
  weight: REGISTRY_WEIGHT,
  pattern: /\bsendCachedPayload\b/,
});

// 2. addChannel() → props.channels arrays.
// FP surface: any unrelated object exposing an addChannel method.
// FN surface: destructured/aliased calls.
regexCheck({
  checkId: 'registry:addChannel',
  opId: 'recognize-never-emit',
  weight: REGISTRY_WEIGHT,
  pattern: /\.\s*addChannel\s*\(/,
  ext: ['.js', '.mjs', '.cjs'],
});

// 3. el$.toggle → toggleClass. Matches `el$.toggle(` and `el$('x').toggle(`.
// Deliberately does NOT match classList.toggle (legit DOM) or toggleClass.
// FN surface: el$ result stored in a variable then .toggle() called on it.
regexCheck({
  checkId: 'registry:el$-toggle',
  opId: 'recognize-never-emit',
  weight: REGISTRY_WEIGHT,
  pattern: /el\$\s*(?:\([^)]*\))?\s*\.\s*toggle\s*\(/,
  ext: ['.js', '.mjs', '.cjs'],
});

// 4. {{.*}} → {{.}} (canonical wins).
regexCheck({
  checkId: 'registry:template-dot-star',
  opId: 'recognize-never-emit',
  weight: REGISTRY_WEIGHT,
  pattern: /\{\{\s*\.\*\s*\}\}/,
});

// 5. String-form props.channels → always arrays.
regexCheck({
  checkId: 'registry:string-channels',
  opId: 'recognize-never-emit',
  weight: REGISTRY_WEIGHT,
  pattern: /props\.channels\s*=\s*['"`]/,
  ext: ['.js', '.mjs', '.cjs'],
});

// 6. Non-array props.traits (string or bare class reference) → always arrays.
// FP surface: `props.traits = someArrayVariable` (legal but flagged);
// documented as acceptable — generated kata code should assign literals.
regexCheck({
  checkId: 'registry:non-array-traits',
  opId: 'recognize-never-emit',
  weight: REGISTRY_WEIGHT,
  pattern: /props\.traits\s*=\s*(?!\[)[A-Za-z_$'"`]/,
  ext: ['.js', '.mjs', '.cjs'],
});

// 7. propFilters wrapper → bare payload keys on ChannelPayloadFilter.
regexCheck({
  checkId: 'registry:propFilters',
  opId: 'recognize-never-emit',
  weight: REGISTRY_WEIGHT,
  pattern: /\bpropFilters\s*:/,
  ext: ['.js', '.mjs', '.cjs', '.json'],
});

// 8. ViewStream.getChannel (raw subject access) — banned on ViewStream classes;
// legitimate inside Channel classes (wire-in-onRegistered). Heuristic: flag
// `this.getChannel(` only in files that define a class extending ViewStream.
// FP surface: a file defining both a Channel and a ViewStream class.
// FN surface: a ViewStream class whose trait file calls this.getChannel —
// trait context IS the view, but the trait file carries no `extends ViewStream`.
CHECKS.push({
  checkId: 'registry:viewstream-getChannel',
  opId: 'recognize-never-emit',
  run(file, text) {
    if (!['.js', '.mjs', '.cjs'].includes(path.extname(file))) return [];
    if (!/extends\s+ViewStream\b/.test(text)) return [];
    const out = [];
    const re = /this\s*\.\s*getChannel\s*\(/g;
    let m;
    while ((m = re.exec(text)) !== null) {
      out.push({
        checkId: 'registry:viewstream-getChannel',
        opId: 'recognize-never-emit',
        weight: REGISTRY_WEIGHT,
        line: lineOfIndex(text, m.index),
        excerpt: excerptAt(text, m.index),
      });
    }
    return out;
  },
});

// --- non-registry checks

// addEventListener in app code — events enter via broadcastEvents / the
// WINDOW channel (ops: declare-broadcast-events, window-event-via-channel).
regexCheck({
  checkId: 'addEventListener',
  opId: 'declare-broadcast-events',
  weight: OTHER_WEIGHT,
  pattern: /\baddEventListener\s*\(/,
  ext: ['.js', '.mjs', '.cjs', '.html'],
});

// Constants files — constants live on SpyneAppProperties, never in scattered
// per-feature constants files (op:spyneappproperties-vs-channel-state,
// CONSTANTS CLAUSE). Checked on the file NAME.
CHECKS.push({
  checkId: 'constants-file',
  opId: 'spyneappproperties-vs-channel-state',
  run(file) {
    const base = path.basename(file).toLowerCase();
    if (/constant/.test(base) && ['.js', '.mjs', '.cjs', '.json'].includes(path.extname(file))) {
      return [{
        checkId: 'constants-file',
        opId: 'spyneappproperties-vs-channel-state',
        weight: OTHER_WEIGHT,
        line: 1,
        excerpt: path.basename(file),
      }];
    }
    return [];
  },
});

// Extra methods on ViewStream classes beyond the four
// (op:wiring-surface-only-on-viewstream). Light brace-matching parse of each
// `class X extends ViewStream { ... }` body; method names at class nesting
// depth 1. FP surface: object literals with shorthand methods at depth 1
// outside a method (unusual); FN surface: class bodies with brace-bearing
// string literals throwing off depth counting.
CHECKS.push({
  checkId: 'viewstream-extra-method',
  opId: 'wiring-surface-only-on-viewstream',
  run(file, text) {
    if (!['.js', '.mjs', '.cjs'].includes(path.extname(file))) return [];
    const out = [];
    const classRe = /class\s+([A-Za-z0-9_$]+)\s+extends\s+ViewStream\b[^{]*\{/g;
    let cm;
    while ((cm = classRe.exec(text)) !== null) {
      const bodyStart = classRe.lastIndex - 1;
      const body = balancedSpan(text, bodyStart, '{', '}');
      // scan depth-1 method heads inside the class body
      let depth = 0;
      const methodRe = /(?:^|\n)\s*(?:static\s+)?(?:async\s+)?(?:get\s+|set\s+)?([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/g;
      // walk body char-by-char tracking depth, testing method heads at depth 1
      for (let i = 0; i < body.length; i++) {
        const ch = body[i];
        if (ch === '{') depth++;
        else if (ch === '}') depth--;
        else if (depth === 1) {
          methodRe.lastIndex = i;
          const mm = methodRe.exec(body);
          if (mm && mm.index === i) {
            const name = mm[1];
            if (!VIEWSTREAM_SURFACE.has(name) && !['if', 'for', 'while', 'switch', 'catch', 'return', 'super'].includes(name)) {
              const absIdx = bodyStart + mm.index;
              out.push({
                checkId: 'viewstream-extra-method',
                opId: 'wiring-surface-only-on-viewstream',
                weight: OTHER_WEIGHT,
                line: lineOfIndex(text, absIdx),
                excerpt: excerptAt(text, absIdx + mm[0].length - mm[1].length - 1),
              });
            }
            i += mm[0].length - 1;
          }
        }
      }
    }
    return out;
  },
});

// Regex-special characters in registered/emitted action labels — labels are
// live regex syntax in the dispatch table (op:match-action-labels-by-pattern).
// Scoped to (a) string literals inside addRegisteredActions() bodies and
// (b) literal label args of sendChannelPayload / sendInfoToChannel — pattern
// entries in addActionListeners are sanctioned MULTI-FORM usage and are NOT
// flagged. FN surface: labels built via template literals or variables.
CHECKS.push({
  checkId: 'regex-specials-in-label',
  opId: 'match-action-labels-by-pattern',
  run(file, text) {
    if (!['.js', '.mjs', '.cjs'].includes(path.extname(file))) return [];
    const out = [];
    const specials = /[.*+?()[\]|^\\]|\$(?![A-Za-z0-9_{])/;
    const flag = (idx, label) => out.push({
      checkId: 'regex-specials-in-label',
      opId: 'match-action-labels-by-pattern',
      weight: OTHER_WEIGHT,
      line: lineOfIndex(text, idx),
      excerpt: excerptAt(text, idx),
    });

    // (a) addRegisteredActions bodies
    const regActRe = /addRegisteredActions\s*\([^)]*\)\s*\{/g;
    let rm;
    while ((rm = regActRe.exec(text)) !== null) {
      const body = balancedSpan(text, regActRe.lastIndex - 1, '{', '}');
      const litRe = /['"]([^'"\n]+)['"]/g;
      let lm;
      while ((lm = litRe.exec(body)) !== null) {
        if (/^CHANNEL_/.test(lm[1]) && specials.test(lm[1])) {
          flag(regActRe.lastIndex - 1 + lm.index, lm[1]);
        }
      }
    }
    // (b) literal label args of send calls (first arg; third for sendInfoToChannel)
    const sendRe = /\b(?:sendChannelPayload|sendInfoToChannel)\s*\(([^)]*)\)/g;
    let sm;
    while ((sm = sendRe.exec(text)) !== null) {
      const litRe = /['"]([^'"\n]+)['"]/g;
      let lm;
      while ((lm = litRe.exec(sm[1])) !== null) {
        if (/^CHANNEL_/.test(lm[1]) && specials.test(lm[1])) {
          flag(sm.index + lm.index, lm[1]);
        }
      }
    }
    return out;
  },
});

// Nested 'payload' key inside payload literals passed to send calls —
// RESERVED-KEYS CLAUSE (op:fetch-conform-map): payload.payload shadows the
// filter's payload-predicate addressing. Scoped to the object argument of
// sendChannelPayload / sendInfoToChannel only; `{ payload: p => ... }` inside
// ChannelPayloadFilter is the sanctioned predicate form and is NOT flagged.
// FN surface: payload objects built in a variable before the call.
CHECKS.push({
  checkId: 'nested-payload-key',
  opId: 'fetch-conform-map',
  run(file, text) {
    if (!['.js', '.mjs', '.cjs'].includes(path.extname(file))) return [];
    const out = [];
    const sendRe = /\b(?:sendChannelPayload|sendInfoToChannel)\s*\(/g;
    let m;
    while ((m = sendRe.exec(text)) !== null) {
      const parenStart = sendRe.lastIndex - 1;
      const args = balancedSpan(text, parenStart, '(', ')');
      const objStart = args.indexOf('{');
      if (objStart === -1) continue;
      const obj = balancedSpan(args, objStart, '{', '}');
      const keyRe = /\bpayload\s*:/g;
      let km;
      while ((km = keyRe.exec(obj)) !== null) {
        const absIdx = parenStart + objStart + km.index;
        out.push({
          checkId: 'nested-payload-key',
          opId: 'fetch-conform-map',
          weight: OTHER_WEIGHT,
          line: lineOfIndex(text, absIdx),
          excerpt: excerptAt(text, absIdx),
        });
      }
    }
    return out;
  },
});

// ---------------------------------------------------------------------------
// public API

export function lintFiles(files, { root = process.cwd() } = {}) {
  const violations = [];
  for (const file of files) {
    const abs = path.isAbsolute(file) ? file : path.join(root, file);
    if (!LINTABLE_EXT.has(path.extname(abs))) continue;
    let text;
    try {
      text = fs.readFileSync(abs, 'utf8');
    } catch {
      continue;
    }
    const rel = path.relative(root, abs);
    for (const check of CHECKS) {
      for (const v of check.run(abs, text)) {
        violations.push({ ...v, file: rel });
      }
    }
  }
  const deduction = violations.reduce((sum, v) => sum + v.weight, 0);
  const l1Score = Math.max(0, 100 - deduction);
  return { violations, l1Score };
}

export function lintDir(dir, { exclude = ['node_modules', '.git', 'tests', 'test-results'] } = {}) {
  const files = [];
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      if (exclude.includes(entry.name)) continue;
      const p = path.join(d, entry.name);
      if (entry.isDirectory()) walk(p);
      else files.push(p);
    }
  };
  walk(dir);
  return lintFiles(files, { root: dir });
}

// CLI: node lint/l1.js <dir> [dir...]
if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1])) && process.argv[2]) {
  const results = process.argv.slice(2).map((d) => ({ dir: d, ...lintDir(d) }));
  console.log(JSON.stringify(results, null, 2));
}
