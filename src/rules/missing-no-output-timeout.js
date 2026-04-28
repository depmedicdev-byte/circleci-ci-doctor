'use strict';
const { jobs, stepsOf, normalizeStep, makeFinding } = require('../parse');

const HANG_PRONE = /(test|spec|e2e|cypress|playwright|integration|deploy|migrate|seed|wait[-_ ]?for|sleep|tail\s+-f|docker\s+(compose\s+up|run))/i;

module.exports = {
  id: 'missing-no-output-timeout',
  severity: 'warn',
  description: 'Long-running run: step has no no_output_timeout. Default is 10 minutes; tests/deploys that legitimately go silent will be killed mid-run, while genuine hangs eat the full job clock.',
  category: 'cost',
  check(parsed) {
    const out = [];
    for (const j of jobs(parsed)) {
      const steps = stepsOf(j.job);
      for (let i = 0; i < steps.length; i++) {
        const n = normalizeStep(steps[i]);
        if (n.type !== 'run') continue;
        if (typeof n.value === 'string') {
          // bare-string command form, no way to set timeout
          if (HANG_PRONE.test(n.value)) {
            out.push(makeFinding(
              module.exports,
              parsed,
              `job '${j.name}' step ${i} runs '${n.value.slice(0, 40)}...' as a bare string. Switch to map form { command: ..., no_output_timeout: 5m } so a hang is bounded.`,
              ['jobs', j.name, 'steps', i],
            ));
          }
          continue;
        }
        if (n.value && typeof n.value === 'object') {
          if (n.value.no_output_timeout) continue;
          const cmd = typeof n.value.command === 'string' ? n.value.command : '';
          if (!HANG_PRONE.test(cmd)) continue;
          out.push(makeFinding(
            module.exports,
            parsed,
            `job '${j.name}' step ${i} ('${(n.value.name || cmd).slice(0, 40)}...') has no no_output_timeout. Add no_output_timeout: 5m so a hang is bounded.`,
            ['jobs', j.name, 'steps', i],
          ));
        }
      }
    }
    return out;
  },
};
