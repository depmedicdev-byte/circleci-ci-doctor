'use strict';
const { jobs, runCommandOf, stepsOf, makeFinding } = require('../parse');

// Linux Docker credit cost per minute (CircleCI 2026 pricing).
const COSTS = {
  small: 5,
  medium: 10,
  'medium+': 15,
  large: 20,
  xlarge: 40,
  '2xlarge': 80,
  '2xlarge+': 100,
  '3xlarge': 120,
};

const HEAVY = /(docker\s+(build|buildx)|cargo\s+build\s+--release|gradle\s+(build|test)|mvn\s+(verify|install|package)|npm\s+run\s+(build|test)|yarn\s+(build|test)|pytest|cypress\s+run|playwright\s+test|webpack|vite\s+build|next\s+build)/i;

module.exports = {
  id: 'expensive-resource-class',
  severity: 'warn',
  description: 'Job uses xlarge / 2xlarge / 3xlarge resource_class without commands that need it. Each tier roughly doubles credit burn per minute.',
  category: 'cost',
  check(parsed) {
    const out = [];
    for (const j of jobs(parsed)) {
      const rc = j.job.resource_class;
      if (typeof rc !== 'string') continue;
      const key = rc.toLowerCase();
      if (!(key in COSTS)) continue;
      if (COSTS[key] < 30) continue; // small/medium/medium+/large are routine
      const allCmds = stepsOf(j.job).map(runCommandOf).join('\n');
      if (HEAVY.test(allCmds)) continue;
      out.push(makeFinding(
        module.exports,
        parsed,
        `job '${j.name}' uses resource_class: ${rc} (~${COSTS[key]} credits/min) but no heavy build/test commands detected. Drop to 'large' (20 credits/min) or 'medium' (10) unless profiling justifies the spend.`,
        ['jobs', j.name, 'resource_class'],
      ));
    }
    return out;
  },
};
