# circleci-ci-doctor

Audit `.circleci/config.yml` for **waste, cost, and security gaps**. MIT, no telemetry.

Sister project to [`ci-doctor`](https://www.npmjs.com/package/ci-doctor) (GitHub Actions), [`gitlab-ci-doctor`](https://www.npmjs.com/package/gitlab-ci-doctor), [`bitbucket-ci-doctor`](https://www.npmjs.com/package/bitbucket-ci-doctor), [`azure-pipelines-ci-doctor`](https://www.npmjs.com/package/azure-pipelines-ci-doctor). Same engine, CircleCI-native rules.

## Install

```bash
npx circleci-ci-doctor
# or
npm i -g circleci-ci-doctor
```

## Use

```bash
circleci-ci-doctor              # audit ./.circleci/config.yml
circleci-ci-doctor --markdown   # PR-comment friendly
circleci-ci-doctor --json       # machine-readable
circleci-ci-doctor --rules      # list checks
circleci-ci-doctor --demo       # smoke-test
circleci-ci-doctor --severity=warn
circleci-ci-doctor --only=expensive-resource-class,docker-no-pin
```

## Rules

| id | severity | category | what |
| --- | --- | --- | --- |
| `expensive-resource-class` | warn | cost | `resource_class: xlarge`/`2xlarge`/`3xlarge` without heavy build/test commands. Each tier ~doubles credit/min. |
| `macos-executor` | warn | cost | `macos:` executor without xcodebuild/swift/fastlane (~10x Linux Docker cost) |
| `docker-no-pin` | warn | security | `docker.image` not pinned to `@sha256:<digest>` |
| `missing-cache` | warn | cost | npm/pip/maven/gradle/cargo/go/bundler install with no `restore_cache`/`save_cache` |
| `orb-no-pin` | warn | security | orb ref not `MAJOR.MINOR.PATCH` (e.g. `circleci/node@5` or `@volatile`) |
| `missing-no-output-timeout` | warn | cost | hang-prone `run:` step (tests/deploys/migrations) without `no_output_timeout` |
| `secret-echo` | warn | security | `env`, `printenv`, `set -x`, or `echo $TOKEN` in a `run:` block |
| `wide-filters` | warn | cost | workflow job has no `filters:` &mdash; runs on every branch push |

## Drop into a workflow

```yaml
version: 2.1
orbs:
  node: circleci/node@5.1.0
jobs:
  ci-audit:
    docker:
      - image: cimg/node:20.10@sha256:<digest>
    resource_class: small
    steps:
      - checkout
      - run:
          name: ci-doctor
          command: npx --yes circleci-ci-doctor --markdown | tee ci-doctor.md
          no_output_timeout: 2m
      - store_artifacts:
          path: ci-doctor.md
workflows:
  audit:
    jobs:
      - ci-audit:
          filters:
            branches:
              only: [main, /^pr\/.*/]
```

## In-browser scanner

Paste any `.circleci/config.yml` at <https://depmedicdev-byte.github.io/scan-circleci.html>. No upload, no signup.

## Family

- CLI: <https://www.npmjs.com/package/circleci-ci-doctor>
- GitHub Actions port: <https://www.npmjs.com/package/ci-doctor>
- GitLab port: <https://www.npmjs.com/package/gitlab-ci-doctor>
- Bitbucket port: <https://www.npmjs.com/package/bitbucket-ci-doctor>
- Azure Pipelines port: <https://www.npmjs.com/package/azure-pipelines-ci-doctor>

MIT (c) depmedic
