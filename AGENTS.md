# Contributor and agent guide

Start with [CONTEXT.md](CONTEXT.md), then [architecture](docs/architecture.md) and the relevant [ADRs](docs/adr/README.md). Use [development](docs/development.md) for checks and packaging. Keep the README focused on makers using the control.

Preserve unrelated working-tree changes. Edit source, not ignored generated manifest types or compiled bundles. Keep public PCF property names compatible; update the manifest, adapter, samples, tests and documentation together when changing the contract. Do not infer deployment authorization from historical handoff notes.

## Agent skills

### Issue tracker

Use GitHub Issues in `Belleye/Leaflet-PCF`; manage findings and follow-up work through `triage`. See [issue tracker](docs/agents/issue-tracker.md).

### Triage labels

Use the canonical five state labels, with `bug` or `enhancement` as category. See [triage labels](docs/agents/triage-labels.md).

### Domain docs

Single-context project: root `CONTEXT.md` and `docs/adr/`. See [domain rules](docs/agents/domain.md).
