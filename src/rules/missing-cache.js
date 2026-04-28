'use strict';
const { jobs, stepsOf, normalizeStep, runCommandOf, makeFinding } = require('../parse');

const MGRS = [
  { id: 'npm', re: /\bnpm\s+(ci|install|i\b)/ },
  { id: 'yarn', re: /\byarn\s+install/ },
  { id: 'pnpm', re: /\bpnpm\s+install/ },
  { id: 'pip', re: /\bpip\s+install/ },
  { id: 'poetry', re: /\bpoetry\s+install/ },
  { id: 'maven', re: /\bmvn\b/ },
  { id: 'gradle', re: /\bgradle\b|\.\/gradlew\b/ },
  { id: 'cargo', re: /\bcargo\s+(build|test|fetch)/ },
  { id: 'go', re: /\bgo\s+(get|mod|build|test)/ },
  { id: 'bundler', re: /\bbundle\s+install/ },
];

function hasCacheStep(steps) {
  for (const s of steps) {
    const n = normalizeStep(s);
    if (n.type === 'restore_cache' || n.type === 'save_cache') return true;
    // node orb / similar
    if (typeof n.type === 'string' && /^(node|python|ruby|go|rust)\/install/.test(n.type)) return true;
  }
  return false;
}

module.exports = {
  id: 'missing-cache',
  severity: 'warn',
  description: 'Job runs npm/pip/maven/gradle/cargo/go/bundler install but has no save_cache/restore_cache pair. Re-downloads dependencies on every run.',
  category: 'cost',
  check(parsed) {
    const out = [];
    for (const j of jobs(parsed)) {
      const steps = stepsOf(j.job);
      if (hasCacheStep(steps)) continue;
      const allCmds = steps.map(runCommandOf).join('\n');
      const hits = MGRS.filter((m) => m.re.test(allCmds));
      if (!hits.length) continue;
      out.push(makeFinding(
        module.exports,
        parsed,
        `job '${j.name}' runs ${hits.map((h) => h.id).join('+')} install but has no restore_cache/save_cache pair. Add a 'restore_cache:' before and 'save_cache:' after the install step.`,
        ['jobs', j.name, 'steps'],
      ));
    }
    return out;
  },
};
