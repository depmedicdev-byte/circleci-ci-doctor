'use strict';
const { jobs, makeFinding } = require('../parse');

const FLOATING = /:(latest|main|master|edge|stable|nightly|alpine|ubuntu|debian|node|python|jdk\d*|jre\d*|\d+\.\d+|\d+|\d{1,2})$/i;

function isUnpinned(ref) {
  if (typeof ref !== 'string' || !ref) return false;
  if (ref.includes('@sha256:')) return false;
  return FLOATING.test(ref) || !ref.includes(':');
}

module.exports = {
  id: 'docker-no-pin',
  severity: 'warn',
  description: 'docker.image entries are not pinned to a digest (image@sha256:...). Floating tags break reproducibility and are a supply-chain risk.',
  category: 'security',
  check(parsed) {
    const out = [];
    for (const j of jobs(parsed)) {
      const ds = Array.isArray(j.job.docker) ? j.job.docker : null;
      if (!ds) continue;
      for (let i = 0; i < ds.length; i++) {
        const img = ds[i] && typeof ds[i] === 'object' ? ds[i].image : null;
        if (!isUnpinned(img)) continue;
        out.push(makeFinding(
          module.exports,
          parsed,
          `job '${j.name}' docker[${i}].image '${img}' is not pinned to a digest. Pin with: image@sha256:<digest> for reproducible builds.`,
          ['jobs', j.name, 'docker', i, 'image'],
        ));
      }
    }
    // executors block
    const execs = (parsed.data && parsed.data.executors) || {};
    if (execs && typeof execs === 'object') {
      for (const [ename, e] of Object.entries(execs)) {
        const ds = e && Array.isArray(e.docker) ? e.docker : null;
        if (!ds) continue;
        for (let i = 0; i < ds.length; i++) {
          const img = ds[i] && typeof ds[i] === 'object' ? ds[i].image : null;
          if (!isUnpinned(img)) continue;
          out.push(makeFinding(
            module.exports,
            parsed,
            `executor '${ename}' docker[${i}].image '${img}' is not pinned to a digest.`,
            ['executors', ename, 'docker', i, 'image'],
          ));
        }
      }
    }
    return out;
  },
};
