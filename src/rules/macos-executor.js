'use strict';
const { jobs, stepsOf, runCommandOf, makeFinding } = require('../parse');

const HEAVY = /(xcodebuild|fastlane|swift\s+build|simulator|notarize|xcrun|pod\s+install|brew\s+install|carthage|ios\b|swiftlint)/i;

module.exports = {
  id: 'macos-executor',
  severity: 'warn',
  description: 'Job uses a macos: executor without Apple-specific commands. macOS minutes on CircleCI cost ~10x Linux Docker minutes.',
  category: 'cost',
  check(parsed) {
    const out = [];
    for (const j of jobs(parsed)) {
      if (!j.job.macos) continue;
      const allCmds = stepsOf(j.job).map(runCommandOf).join('\n');
      if (HEAVY.test(allCmds)) continue;
      out.push(makeFinding(
        module.exports,
        parsed,
        `job '${j.name}' uses macos: executor (~10x Linux Docker cost) but no Apple-specific commands (xcodebuild, fastlane, swift, ...) detected. Move to a docker: executor.`,
        ['jobs', j.name, 'macos'],
      ));
    }
    return out;
  },
};
