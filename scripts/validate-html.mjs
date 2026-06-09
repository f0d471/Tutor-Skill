#!/usr/bin/env node

/**
 * validate-html.mjs
 * 
 * Validates the generated HTML courseware for:
 * 1. W3C markup validity (well-formed HTML)
 * 2. Accessibility basics (alt attributes, heading hierarchy)
 * 3. Internal resource references (image paths, anchor links)
 * 4. Required structural elements (callout labels, phase markers)
 * 
 * Usage:
 *   node scripts/validate-html.mjs <path-to-html-file>
 * 
 * Exit code: 0 = pass, 1 = validation errors found
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { JSDOM } from 'jsdom';

const htmlPath = process.argv[2];
if (!htmlPath) {
  console.error('Usage: node scripts/validate-html.mjs <path-to-html-file>');
  process.exit(1);
}

const html = readFileSync(resolve(htmlPath), 'utf-8');
const dom = new JSDOM(html);
const doc = dom.window.document;

let errors = 0;
let warnings = 0;

function logError(msg)  { console.error(`  ❌ ${msg}`); errors++; }
function logWarning(msg) { console.warn(`  ⚠️  ${msg}`); warnings++; }
function logPass(msg)    { console.log(`  ✅ ${msg}`); }

console.log(`\n🔍 Validating: ${htmlPath}\n`);

// ── 1. W3C well-formed checks ──────────────────────────────────
console.log('── W3C Well-formed ──');

// Check for unclosed common tags
const voidElements = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
const allTags = html.match(/<\/?([a-zA-Z0-9]+)[^>]*>/g) || [];
const tagStack = [];
const openCloseMap = {};

for (const tag of allTags) {
  const isClose = tag.startsWith('</');
  const tagName = (isClose ? tag.slice(2, -1) : tag.slice(1, -1).split(' ')[0].split('>')[0]).toLowerCase();
  if (voidElements.has(tagName)) continue;
  if (isClose) {
    if (tagStack.length === 0 || tagStack[tagStack.length - 1] !== tagName) {
      if (tagStack.includes(tagName)) {
        logError(`Mismatched closing tag </${tagName}> — expected </${tagStack[tagStack.length - 1]}>`);
      }
    }
    if (tagStack.length > 0 && tagStack[tagStack.length - 1] === tagName) {
      tagStack.pop();
    }
  } else {
    tagStack.push(tagName);
  }
}

if (tagStack.length > 0) {
  for (const tag of tagStack.reverse()) {
    logError(`Unclosed tag: <${tag}>`);
  }
}

if (errors === 0) {
  const startCount = (html.match(/<script\b/gi) || []).length;
  const endCount = (html.match(/<\/script>/gi) || []).length;
  if (startCount !== endCount) {
    logError(`Script tag mismatch: ${startCount} open, ${endCount} close`);
  }
}

if (errors === 0) logPass('HTML structure is well-formed');

// ── 2. Accessibility basics ────────────────────────────────────
console.log('\n── Accessibility ──');

const images = doc.querySelectorAll('img');
let imgsWithoutAlt = 0;
for (const img of images) {
  if (!img.hasAttribute('alt') || img.getAttribute('alt').trim() === '') {
    imgsWithoutAlt++;
    logWarning(`Image without alt text: src="${img.getAttribute('src') || '(none)'}"`);
  }
}
if (imgsWithoutAlt === 0 && images.length > 0) {
  logPass(`All ${images.length} images have alt text`);
} else if (images.length === 0) {
  logPass('No images found (skip)');
}

// Heading hierarchy
const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
let lastLevel = 0;
for (const h of headings) {
  const level = parseInt(h.tagName[1]);
  if (lastLevel > 0 && level > lastLevel + 1) {
    logWarning(`Heading skip: h${lastLevel} → h${level} (missing h${lastLevel + 1})`);
  }
  lastLevel = level;
}
logPass('Heading hierarchy checked');

// Color contrast warning for known bad patterns
const styleText = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
for (const s of styleText) {
  if (s.includes('background-clip: text') && s.includes('#fff') || s.includes('#ffffff')) {
    logWarning('Gradient text detected — may be hard to read (Forbidden #8)');
  }
}

// ── 3. Internal references ─────────────────────────────────────
console.log('\n── Internal References ──');

const srcPaths = [];
for (const img of images) {
  const src = img.getAttribute('src');
  if (src && !src.startsWith('http') && !src.startsWith('data:')) {
    srcPaths.push(src);
  }
}

if (srcPaths.length > 0) {
  const { existsSync } = await import('fs');
  const htmlDir = resolve(htmlPath, '..');
  let missingCount = 0;
  for (const src of srcPaths) {
    const fullPath = resolve(htmlDir, src);
    if (!existsSync(fullPath)) {
      missingCount++;
      logWarning(`Referenced file not found: ${src}`);
    }
  }
  if (missingCount === 0) {
    logPass(`All ${srcPaths.length} local references resolve`);
  }
} else {
  logPass('No local file references (skip)');
}

// Check internal anchor links
const anchors = doc.querySelectorAll('a[href^="#"]');
const allIds = new Set();
doc.querySelectorAll('[id]').forEach(el => allIds.add(el.id));
let brokenAnchors = 0;
for (const a of anchors) {
  const href = a.getAttribute('href').slice(1);
  if (href && !allIds.has(href)) {
    brokenAnchors++;
    logWarning(`Broken anchor link: #${href}`);
  }
}
if (brokenAnchors === 0 && anchors.length > 0) {
  logPass(`All ${anchors.length} anchor links resolve`);
}

// ── 4. Tutor-Skill structural requirements ─────────────────────
console.log('\n── Structural Requirements ──');

// Phase markers
const phaseMarkers = ['§1', '§2', '§3', '§4', '§5', '§6', '§7'];
for (const marker of phaseMarkers) {
  if (!html.includes(marker)) {
    logWarning(`Phase marker not found: ${marker}`);
  }
}

// Callout labels
const callouts = doc.querySelectorAll('.callout');
let unlabeledCallouts = 0;
for (const c of callouts) {
  const label = c.querySelector('.callout-label') || c.getAttribute('data-source');
  if (!label) unlabeledCallouts++;
}
if (unlabeledCallouts > 0) {
  logError(`${unlabeledCallouts} callout(s) without source label`);
} else if (callouts.length > 0) {
  logPass(`All ${callouts.length} callouts have source labels`);
}

// Knowledge map (SVG or Mermaid)
const hasKnowledgeMap = html.includes('<svg') || html.includes('class="mermaid"');
if (hasKnowledgeMap) {
  logPass('Knowledge map present');
} else {
  logWarning('No knowledge map (SVG or Mermaid) found — required by §1');
}

// Details/summary for quiz answers
const detailsElements = doc.querySelectorAll('details');
if (detailsElements.length > 0) {
  logPass(`Quiz answers use <details><summary> (${detailsElements.length} found)`);
}

// ── Summary ────────────────────────────────────────────────────
console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`  ${errors > 0 ? '❌' : '✅'} ${errors} error(s), ${warnings} warning(s)`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

process.exit(errors > 0 ? 1 : 0);
