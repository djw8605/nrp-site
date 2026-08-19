#!/usr/bin/env node
/**
 * Heading-hierarchy guard for the Starlight docs tree.
 *
 * Starlight renders the frontmatter `title` as the page's only <h1>, so body
 * content must start at <h2> and step down one level at a time. Before this
 * guard existed, 54 of 146 pages broke that: 19 emitted a second <h1> in the
 * body (gateway.md rendered four), 31 opened at ### or ####, and one shipped
 * `title: Title` to the browser tab, the search index, and the OG card.
 *
 * Rules enforced (all currently pass; a new violation fails the build):
 *   1. no-body-h1      -- no `# ` heading in the body; the title owns the h1
 *   2. starts-at-h2    -- the first body heading is `##`
 *   3. no-level-skip   -- headings never jump down more than one level
 *   4. no-placeholder  -- frontmatter is not the scaffold's `Title`/`Description`
 *
 * Only column-0 headings are considered. Indented headings belong to list
 * items and MDX component children, where the surrounding block owns the
 * nesting; the rendered outline is unaffected by them.
 *
 * Usage: node scripts/check-docs-headings.mjs [--quiet]
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const DOCS_ROOT = 'src/content/docs';
const FENCE = /^(`{3,}|~{3,})(.*)$/;
const ATX = /^(#{1,6})(\s.*)?$/;
const PLACEHOLDER = { title: 'Title', description: 'Description' };

function walkDir(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walkDir(full));
    else if (/\.mdx?$/.test(name)) out.push(full);
  }
  return out;
}

/** Index of the closing `---` of the frontmatter block, or -1. */
function frontmatterEnd(lines) {
  if (lines[0]?.trim() !== '---') return -1;
  for (let i = 1; i < lines.length; i++) if (lines[i].trim() === '---') return i;
  return -1;
}

/**
 * Column-0 ATX headings, skipping column-0 fenced code blocks.
 * A closing fence carries no info string (CommonMark), so ```bash inside an
 * open block stays content rather than terminating it.
 */
function topLevelHeadings(lines, fmEnd) {
  const found = [];
  let fence = null;
  for (let n = fmEnd + 1; n < lines.length; n++) {
    const line = lines[n];
    if (line.startsWith(' ') || line.startsWith('\t')) continue;
    const fenceMatch = FENCE.exec(line);
    if (fence === null) {
      if (fenceMatch) {
        fence = { char: fenceMatch[1][0], len: fenceMatch[1].length };
        continue;
      }
      const headingMatch = ATX.exec(line);
      if (headingMatch) {
        found.push({ line: n + 1, level: headingMatch[1].length, text: (headingMatch[2] ?? '').trim() });
      }
    } else if (
      fenceMatch &&
      fenceMatch[1][0] === fence.char &&
      fenceMatch[1].length >= fence.len &&
      fenceMatch[2].trim() === ''
    ) {
      fence = null;
    }
  }
  return found;
}

function checkFile(path) {
  const lines = readFileSync(path, 'utf8').split('\n');
  const fmEnd = frontmatterEnd(lines);
  const problems = [];

  for (const [key, placeholder] of Object.entries(PLACEHOLDER)) {
    const re = new RegExp(`^${key}:\\s*["']?${placeholder}["']?\\s*$`);
    for (let i = 1; i < (fmEnd === -1 ? 0 : fmEnd); i++) {
      if (re.test(lines[i])) {
        problems.push({
          rule: 'no-placeholder',
          line: i + 1,
          message: `frontmatter \`${key}: ${placeholder}\` is the scaffold placeholder; write a real ${key}`,
        });
      }
    }
  }

  const headings = topLevelHeadings(lines, fmEnd);
  if (headings.length === 0) return problems;

  for (const h of headings) {
    if (h.level === 1) {
      problems.push({
        rule: 'no-body-h1',
        line: h.line,
        message: `\`# ${h.text}\` adds a second <h1>; the frontmatter title already renders one. Use \`## \`.`,
      });
    }
  }

  const first = headings[0];
  if (first.level > 2) {
    problems.push({
      rule: 'starts-at-h2',
      line: first.line,
      message: `first body heading is <h${first.level}> (\`${'#'.repeat(first.level)} ${first.text}\`); it must be <h2>`,
    });
  }

  let prev = first.level;
  for (const h of headings.slice(1)) {
    if (h.level > prev + 1) {
      problems.push({
        rule: 'no-level-skip',
        line: h.line,
        message: `<h${prev}> jumps to <h${h.level}> (\`${'#'.repeat(h.level)} ${h.text}\`); step down one level at a time`,
      });
    }
    prev = h.level;
  }

  return problems;
}

const quiet = process.argv.includes('--quiet');
let files;
try {
  files = walkDir(DOCS_ROOT).sort();
} catch {
  console.error(`check-docs-headings: cannot read ${DOCS_ROOT} — run from the repo root.`);
  process.exit(2);
}

let violations = 0;
let badFiles = 0;
for (const file of files) {
  const problems = checkFile(file);
  if (problems.length === 0) continue;
  badFiles++;
  violations += problems.length;
  console.error(`\n${relative('.', file)}`);
  for (const p of problems) console.error(`  ${p.line}:  [${p.rule}] ${p.message}`);
}

if (violations > 0) {
  console.error(
    `\ncheck-docs-headings: ${violations} problem${violations === 1 ? '' : 's'} in ${badFiles} file${badFiles === 1 ? '' : 's'}.\n` +
      `Starlight renders the frontmatter title as the page's only <h1>; body headings start at ## and step down one at a time.\n`
  );
  process.exit(1);
}

if (!quiet) console.log(`check-docs-headings: ${files.length} pages OK`);
