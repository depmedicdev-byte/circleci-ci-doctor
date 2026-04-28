'use strict';
const { workflowJobs, makeFinding } = require('../parse');

module.exports = {
  id: 'wide-filters',
  severity: 'warn',
  description: 'Workflow job has no branch filter. Without filters: { branches: { only: [main] } }, the job runs on every branch push including draft and renovate branches.',
  category: 'cost',
  check(parsed) {
    const out = [];
    const wf = (parsed.data && parsed.data.workflows) || {};
    for (const [wname, wval] of Object.entries(wf)) {
      if (wname === 'version') continue;
      if (!wval || typeof wval !== 'object') continue;
      const jobsArr = Array.isArray(wval.jobs) ? wval.jobs : [];
      for (let i = 0; i < jobsArr.length; i++) {
        const ref = jobsArr[i];
        if (typeof ref === 'string') {
          out.push(makeFinding(
            module.exports,
            parsed,
            `workflow '${wname}' job '${ref}' has no filters. Add filters: { branches: { only: [main, /^release\\/.*/] } } so non-source branches don't burn credits.`,
            ['workflows', wname, 'jobs', i],
          ));
          continue;
        }
        if (ref && typeof ref === 'object') {
          const jobName = Object.keys(ref)[0];
          const cfg = ref[jobName] || {};
          if (cfg.filters) continue;
          out.push(makeFinding(
            module.exports,
            parsed,
            `workflow '${wname}' job '${jobName}' has no filters. Add filters: { branches: { only: [main, /^release\\/.*/] } } so non-source branches don't burn credits.`,
            ['workflows', wname, 'jobs', i, jobName],
          ));
        }
      }
    }
    return out;
  },
};
