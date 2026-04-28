'use strict';

const YAML = require('yaml');

function parseCircleConfig(source, filename) {
  const lineCounter = new YAML.LineCounter();
  const doc = YAML.parseDocument(source, { keepSourceTokens: true, lineCounter });
  doc.lineCounter = lineCounter;
  const errors = doc.errors.map((e) => ({
    severity: 'error',
    ruleId: 'parse-error',
    message: e.message,
    line: e.linePos ? e.linePos[0].line : 1,
    column: e.linePos ? e.linePos[0].col : 1,
    filename,
  }));
  const data = doc.toJS({ maxAliasCount: -1 }) || {};
  return { doc, data, errors, filename };
}

// Returns [{ name, job }] for every job in `jobs:`.
function jobs(parsed) {
  const out = [];
  const jobsMap = (parsed.data && parsed.data.jobs) || {};
  if (!jobsMap || typeof jobsMap !== 'object') return out;
  for (const [name, job] of Object.entries(jobsMap)) {
    if (job && typeof job === 'object') out.push({ name, job });
  }
  return out;
}

// Returns [{ workflowName, jobRef, index }] for every job ref in every workflow.
function workflowJobs(parsed) {
  const out = [];
  const wf = (parsed.data && parsed.data.workflows) || {};
  if (!wf || typeof wf !== 'object') return out;
  for (const [wname, wval] of Object.entries(wf)) {
    if (wname === 'version') continue;
    if (!wval || typeof wval !== 'object') continue;
    const jobsArr = Array.isArray(wval.jobs) ? wval.jobs : [];
    for (let i = 0; i < jobsArr.length; i++) {
      out.push({ workflowName: wname, jobRef: jobsArr[i], index: i });
    }
  }
  return out;
}

function stepsOf(job) {
  return Array.isArray(job && job.steps) ? job.steps : [];
}

// Each step is either a string ('checkout') or { run: ... } / { save_cache: ... }.
// Normalises to { type, value } where value is an object or string.
function normalizeStep(step) {
  if (typeof step === 'string') return { type: step, value: null };
  if (step && typeof step === 'object') {
    const keys = Object.keys(step);
    if (keys.length === 1) {
      const k = keys[0];
      return { type: k, value: step[k] };
    }
  }
  return { type: '<unknown>', value: null };
}

function runCommandOf(step) {
  const n = normalizeStep(step);
  if (n.type !== 'run') return '';
  if (typeof n.value === 'string') return n.value;
  if (n.value && typeof n.value === 'object' && typeof n.value.command === 'string') return n.value.command;
  return '';
}

function nodeAt(doc, pathParts) {
  let node = doc.contents;
  for (const part of pathParts) {
    if (!node) return null;
    if (typeof part === 'number' && node.items) {
      node = node.items[part];
    } else if (node.items) {
      const pair = node.items.find((p) => p.key && (p.key.value === part || p.key.source === part));
      node = pair ? pair.value : null;
    } else {
      return null;
    }
  }
  return node;
}

function lineOf(doc, pathParts) {
  const node = nodeAt(doc, pathParts);
  if (!node || !node.range) return { line: 1, column: 1 };
  const lc = doc.lineCounter ? doc.lineCounter.linePos(node.range[0]) : null;
  if (lc) return { line: lc.line, column: lc.col };
  return { line: 1, column: 1 };
}

function makeFinding(rule, parsed, message, pathParts, extras = {}) {
  const p = lineOf(parsed.doc, pathParts);
  return {
    ruleId: rule.id,
    severity: rule.severity,
    message,
    line: p.line,
    column: p.column,
    filename: parsed.filename,
    ...extras,
  };
}

module.exports = {
  parseCircleConfig,
  jobs,
  workflowJobs,
  stepsOf,
  normalizeStep,
  runCommandOf,
  nodeAt,
  lineOf,
  makeFinding,
};
