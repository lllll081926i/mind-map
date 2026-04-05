# Contributing

## Scope

This repository is maintained as a desktop-first MindMap application based on Vue 3, Tauri 2, and `simple-mind-map`.

Contributions should preserve:

- local-first document workflow
- desktop packaging stability
- cross-platform file association behavior
- regression safety through tests

## Before You Start

1. Use Node.js `22.x`
2. Install dependencies with `npm ci`
3. Read the active code review documents in [`docs/code-review`](/d:/Code/mind-map/docs/code-review)

## Required Checks

Run these before opening a PR:

```bash
npm run lint
npm run typecheck
npm run test:all
npm run test:e2e
cargo check --manifest-path src-tauri/Cargo.toml
```

If your change affects Rust services, prefer:

```bash
cargo test --manifest-path src-tauri/Cargo.toml
```

## Change Rules

- Do not revert unrelated user changes in the worktree
- Prefer editing existing files over creating new ones
- Keep Windows/macOS/Linux behavior aligned when touching file associations or packaging
- Add or update tests for every behavior change or bug fix
- When changing release or installer behavior, update the corresponding workflow or packaging docs

## Pull Request Expectations

Every PR should include:

- what changed
- why it changed
- how it was verified
- any remaining risk or follow-up

## Documentation

If you change packaging, release flow, file associations, or audit conclusions, update the relevant file under `docs/`.
