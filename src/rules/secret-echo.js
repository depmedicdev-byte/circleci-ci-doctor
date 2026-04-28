'use strict';
const { jobs, stepsOf, runCommandOf, makeFinding } = require('../parse');

const PATTERNS = [
  { re: /\benv\s*$/m, why: "'env' lists every environment variable, including masked secrets, into the build log." },
  { re: /\bprintenv\b/, why: "'printenv' prints every environment variable into the build log." },
  { re: /\bset\s+-x\b/, why: "'set -x' echoes every command, expanding $SECRET into the log." },
  { re: /echo\s+["']?\$\{?[A-Z][A-Z0-9_]*(SECRET|TOKEN|KEY|PASSWORD|PWD)\b/i, why: "echoing a $SECRET-named variable prints the secret in plain text." },
];

module.exports = {
  id: 'secret-echo',
  severity: 'warn',
  description: "run: command contains env / printenv / set -x / echo $SECRET - secrets may leak to the build log.",
  category: 'security',
  check(parsed) {
    const out = [];
    for (const j of jobs(parsed)) {
      const steps = stepsOf(j.job);
      for (let i = 0; i < steps.length; i++) {
        const cmd = runCommandOf(steps[i]);
        if (!cmd) continue;
        const hit = PATTERNS.find((p) => p.re.test(cmd));
        if (!hit) continue;
        out.push(makeFinding(
          module.exports,
          parsed,
          `job '${j.name}' step ${i} ${hit.why}`,
          ['jobs', j.name, 'steps', i],
        ));
      }
    }
    return out;
  },
};
