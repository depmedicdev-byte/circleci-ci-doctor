# Changelog

## 0.1.0 - 2026-04-28

Initial release. 8 rules across cost / security:

- **expensive-resource-class** (cost) - xlarge / 2xlarge / 3xlarge without heavy build/test commands
- **macos-executor** (cost) - macos: executor without Apple-specific commands (~10x Linux Docker cost)
- **docker-no-pin** (security) - docker.image not pinned to `@sha256:<digest>`
- **missing-cache** (cost) - npm / pip / maven / gradle / cargo / go / bundler install without `restore_cache`/`save_cache`
- **orb-no-pin** (security) - orb ref not `MAJOR.MINOR.PATCH` (e.g. `@5` or `@volatile`)
- **missing-no-output-timeout** (cost) - hang-prone `run:` step without `no_output_timeout`
- **secret-echo** (security) - `env`, `printenv`, `set -x`, `echo $TOKEN` in a `run:` block
- **wide-filters** (cost) - workflow job has no `filters:`

Reporters: text (default), JSON (`--json`), Markdown (`--markdown`).
Tests: 5 green via `node --test`.
