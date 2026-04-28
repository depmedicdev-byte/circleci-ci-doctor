'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { auditConfig, summarize, rules } = require('../src/index');

function audit(yaml, opts = {}) {
  return auditConfig(yaml, '.circleci/config.yml', opts);
}
const ids = (fs) => fs.map((f) => f.ruleId).sort();

test('demo file fires every rule', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'examples', 'bad-circle-config.yml'), 'utf8');
  const f = audit(src);
  const got = new Set(ids(f));
  for (const r of rules) {
    assert.ok(got.has(r.id), `expected rule ${r.id} to fire on demo file. got: ${[...got].join(', ')}`);
  }
});

test('clean config produces zero findings', () => {
  const src = `version: 2.1

orbs:
  node: circleci/node@5.1.0

jobs:
  build:
    resource_class: medium
    docker:
      - image: cimg/node:18@sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
    steps:
      - checkout
      - restore_cache:
          keys: [v1-deps]
      - run: npm ci
      - save_cache:
          paths: [~/.npm]
          key: v1-deps
      - run:
          name: tests
          command: npm test
          no_output_timeout: 5m

workflows:
  build-test:
    jobs:
      - build:
          filters:
            branches:
              only: [main]
`;
  const f = audit(src);
  assert.deepEqual(f, [], 'unexpected findings: ' + JSON.stringify(f, null, 2));
});

test('rule metadata is well-formed', () => {
  for (const r of rules) {
    assert.ok(r.id);
    assert.match(r.severity, /^(error|warn|info)$/);
    assert.ok(r.description);
    assert.ok(typeof r.check === 'function');
  }
});

test('summarize counts severities', () => {
  const f = audit(`version: 2.1
jobs:
  build:
    macos:
      xcode: '15.0'
    steps:
      - run: npm test
workflows:
  x:
    jobs:
      - build
`);
  const s = summarize(f);
  assert.equal(s.total, f.length);
  assert.ok(s.warn >= 1);
});

test('orb-no-pin fires on @volatile', () => {
  const f = audit(`version: 2.1
orbs:
  slack: circleci/slack@volatile
jobs:
  build:
    docker: [{image: 'cimg/node:18@sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'}]
    steps: [checkout]
workflows:
  x:
    jobs:
      - build:
          filters: { branches: { only: [main] } }
`);
  assert.ok(f.some((x) => x.ruleId === 'orb-no-pin'));
});
