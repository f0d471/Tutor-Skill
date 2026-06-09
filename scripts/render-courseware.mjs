#!/usr/bin/env node

/**
 * render-courseware.mjs
 * 
 * Bounded-generation renderer for Tutor-Skill Phase 4 (逐字精读).
 * Reads a structured JSON description of §4 content and renders it as
 * a valid, well-formed HTML fragment using tested templates.
 * 
 * JSON Schema (see top of file for full docs):
 * 
 * {
 *   "sections": [
 *     {
 *       "type": "definition" | "derivation" | "example" | "callout" | "diagram",
 *       "title": "Section title",
 *       "content": {
 *         "sourceQuote": "...",   // original text (for definition/derivation)
 *         "explanation": "...",   // Agent's explanation
 *         "steps": [              // for derivation type
 *           { "number": 1, "text": "...", "highlight": false }
 *         ],
 *         "formula": "...",       // LaTeX or plain text formula
 *         "positiveExample": "...",
 *         "negativeExample": "...",
 *         "calloutType": "book-supplement" | "ppt-supplement" | "key-insight",
 *         "diagramSrc": "...",    // path to SVG or image
 *         "diagramCaption": "..."
 *       }
 *     }
 *   ]
 * }
 * 
 * Usage:
 *   node scripts/render-courseware.mjs <path-to-json>
 * 
 * Output: HTML fragment to stdout
 *   The fragment is designed to be embedded into the main template's §4 section.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const jsonPath = process.argv[2];
if (!jsonPath) {
  console.error('Usage: node scripts/render-courseware.mjs <path-to-json>');
  process.exit(1);
}

let data;
try {
  data = JSON.parse(readFileSync(resolve(jsonPath), 'utf-8'));
} catch (e) {
  console.error(`Failed to parse JSON: ${e.message}`);
  process.exit(1);
}

if (!data.sections || !Array.isArray(data.sections)) {
  console.error('Invalid JSON: missing "sections" array');
  process.exit(1);
}

// ── Schema validation ──────────────────────────────────────────
const validTypes = new Set(['definition', 'derivation', 'example', 'callout', 'diagram']);
const validCalloutTypes = new Set(['book-supplement', 'ppt-supplement', 'key-insight', 'warning']);

for (let i = 0; i < data.sections.length; i++) {
  const sec = data.sections[i];
  if (!sec.type || !validTypes.has(sec.type)) {
    console.error(`Section ${i}: invalid or missing type "${sec.type}" (valid: ${[...validTypes].join(', ')})`);
    process.exit(1);
  }
  if (!sec.title) {
    console.error(`Section ${i}: missing title`);
    process.exit(1);
  }
  
  const c = sec.content || {};
  if (sec.type === 'derivation' && c.steps) {
    for (let j = 0; j < c.steps.length; j++) {
      const step = c.steps[j];
      if (typeof step.number !== 'number' || !step.text) {
        console.error(`Section ${i}, step ${j}: each step needs "number" and "text"`);
        process.exit(1);
      }
    }
  }
  
  if (sec.type === 'callout' && c.calloutType && !validCalloutTypes.has(c.calloutType)) {
    console.error(`Section ${i}: invalid calloutType "${c.calloutType}" (valid: ${[...validCalloutTypes].join(', ')})`);
    process.exit(1);
  }
}

// ── Escape helpers ─────────────────────────────────────────────
function esc(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Renderer ───────────────────────────────────────────────────
function renderCalloutType(cType) {
  const map = {
    'book-supplement': 'callout-book',
    'ppt-supplement': 'callout-ppt',
    'key-insight': 'callout-key',
    'warning': 'callout-warn'
  };
  return map[cType] || 'callout-info';
}

function renderDefinition(sec) {
  const c = sec.content || {};
  let html = `<section class="definition-block">\n`;
  html += `  <h3>${esc(sec.title)}</h3>\n`;
  if (c.sourceQuote) html += `  <blockquote class="source-quote">${esc(c.sourceQuote)}</blockquote>\n`;
  if (c.explanation) html += `  <div class="explanation">${esc(c.explanation)}</div>\n`;
  if (c.formula) html += `  <div class="formula">${c.formula}</div>\n`;
  if (c.positiveExample) {
    html += `  <div class="example positive">\n`;
    html += `    <div class="example-label">✅ 正例</div>\n`;
    html += `    <p>${esc(c.positiveExample)}</p>\n`;
    html += `  </div>\n`;
  }
  if (c.negativeExample) {
    html += `  <div class="example negative">\n`;
    html += `    <div class="example-label">❌ 反例</div>\n`;
    html += `    <p>${esc(c.negativeExample)}</p>\n`;
    html += `  </div>\n`;
  }
  html += `</section>\n`;
  return html;
}

function renderDerivation(sec) {
  const c = sec.content || {};
  let html = `<section class="derivation-block">\n`;
  html += `  <h3>${esc(sec.title)}</h3>\n`;
  if (c.sourceQuote) html += `  <blockquote class="source-quote">${esc(c.sourceQuote)}</blockquote>\n`;
  
  if (c.steps && c.steps.length > 0) {
    html += `  <ol class="derivation-steps">\n`;
    for (const step of c.steps) {
      const highlightClass = step.highlight ? ' class="key-step"' : '';
      const prefix = step.highlight ? '🔑 ' : '';
      html += `    <li${highlightClass}><strong>Step ${step.number}/${c.steps.length}：</strong>${prefix}${esc(step.text)}</li>\n`;
    }
    html += `  </ol>\n`;
  }
  
  if (c.explanation) html += `  <div class="explanation">${esc(c.explanation)}</div>\n`;
  html += `</section>\n`;
  return html;
}

function renderExample(sec) {
  const c = sec.content || {};
  let html = `<section class="example-block">\n`;
  html += `  <h3>${esc(sec.title)}</h3>\n`;
  if (c.sourceQuote) html += `  <blockquote class="source-quote">${esc(c.sourceQuote)}</blockquote>\n`;
  if (c.explanation) html += `  <div class="explanation">${esc(c.explanation)}</div>\n`;
  if (c.formula) html += `  <div class="formula">${c.formula}</div>\n`;
  html += `</section>\n`;
  return html;
}

function renderCallout(sec) {
  const c = sec.content || {};
  const cClass = renderCalloutType(c.calloutType || 'book-supplement');
  let html = `<aside class="callout ${cClass}">\n`;
  html += `  <div class="callout-title">${esc(sec.title)}</div>\n`;
  if (c.explanation) html += `  <p>${esc(c.explanation)}</p>\n`;
  html += `</aside>\n`;
  return html;
}

function renderDiagram(sec) {
  const c = sec.content || {};
  let html = `<section class="diagram-block">\n`;
  html += `  <h3>${esc(sec.title)}</h3>\n`;
  if (c.diagramSrc) {
    if (c.diagramSrc.endsWith('.svg')) {
      html += `  <div class="diagram-svg">(Embed SVG from: ${esc(c.diagramSrc)})</div>\n`;
    } else {
      html += `  <img src="${esc(c.diagramSrc)}" alt="${esc(c.diagramCaption || sec.title)}">\n`;
    }
  }
  if (c.diagramCaption) html += `  <p class="diagram-caption">${esc(c.diagramCaption)}</p>\n`;
  html += `</section>\n`;
  return html;
}

// ── Main render loop ───────────────────────────────────────────
const renderers = {
  definition: renderDefinition,
  derivation: renderDerivation,
  example: renderExample,
  callout: renderCallout,
  diagram: renderDiagram,
};

let output = `<!-- Generated by render-courseware.mjs — Phase 4 bounded generation -->\n`;
output += `<div class="phase-4-content">\n`;

for (const sec of data.sections) {
  const render = renderers[sec.type];
  if (render) {
    output += render(sec);
  } else {
    console.error(`Unknown section type: ${sec.type} in "${sec.title}"`);
  }
}

output += `</div>\n`;

process.stdout.write(output);
