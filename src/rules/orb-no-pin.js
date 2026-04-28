'use strict';
const { makeFinding } = require('../parse');

// Pinned: owner/name@MAJOR.MINOR.PATCH (e.g. circleci/node@5.1.0)
// Floating: @volatile, @5, @5.1, @x.y.z+...
const PINNED = /^[a-z0-9_-]+\/[a-z0-9_-]+@\d+\.\d+\.\d+$/;
const FLOATING_RANGE = /(@volatile|@dev:|@\d+$|@\d+\.\d+$|@x|@~)/i;

module.exports = {
  id: 'orb-no-pin',
  severity: 'warn',
  description: 'orbs entries are not pinned to MAJOR.MINOR.PATCH. Floating orb refs (@volatile, @5, @5.x) silently change behavior.',
  category: 'security',
  check(parsed) {
    const out = [];
    const orbs = (parsed.data && parsed.data.orbs) || {};
    if (!orbs || typeof orbs !== 'object') return out;
    for (const [alias, ref] of Object.entries(orbs)) {
      if (typeof ref !== 'string') continue;
      if (PINNED.test(ref)) continue;
      if (!ref.includes('@')) continue; // local orbs ({} value) skip
      out.push(makeFinding(
        module.exports,
        parsed,
        `orb '${alias}: ${ref}' is not pinned to MAJOR.MINOR.PATCH (e.g. ${alias.split('/').slice(-1)[0]}@5.1.0). Floating refs silently update.`,
        ['orbs', alias],
      ));
    }
    return out;
  },
};
