# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and the project follows Semantic Versioning where practical.

## [Unreleased]

## [0.2.10] - 2026-04-05

### Changed
- Refreshed the desktop editor chrome with a flatter top toolbar, lighter side panels, and rounded line icons inspired by the latest design reference
- Added a setting to toggle top toolbar labels while keeping labels enabled by default
- Redesigned the export dialog into a three-column layout with a larger interactive preview that supports drag and zoom
- Simplified settings and sidebar content spacing to better fit the new desktop layout rhythm
- Switched update checks to GitHub latest release parsing and streamlined update prompts to jump straight to the newest release page
- Hardened desktop release workflow validation for Apple signing inputs before build steps run

### Fixed
- Improved dark-mode readability for editor text, toolbar labels, and search UI
- Corrected outdated desktop toolbar entrypoint assertions so release verification matches the current UI structure
- Tightened export dialog close behavior so it only dismisses via overlay click while preserving in-progress protection

## [0.2.9] - 2026-04-05

### Added
- Playwright E2E smoke test for desktop web shell routes
- AI proxy behavior tests and P0/P1/P2 hardening checks
- Windows Default Programs / Open With registry registration for `.smm`
- Linux desktop entry for `.smm` MIME association
- System credential storage for AI API key persistence
- Repository governance files: changelog, contributing guide, PR template, issue templates, code owners

### Changed
- Enabled stricter JavaScript type checking on the desktop critical path
- Hardened local AI proxy authentication and client token propagation
- Unified workspace linting under the root flat ESLint config
- Tightened Tauri development CSP localhost rules to explicit ports while preserving required local endpoints
- Improved desktop release workflow verification, E2E coverage, and signing hooks

### Fixed
- Windows `.smm` association icon path now points to the actual installed icon
- `.smm` recommended app visibility on Windows now uses Capabilities and RegisteredApplications
- `.smm` file association metadata is now more complete across Windows, macOS, and Linux
- Core desktop white-screen and path regressions remain covered by regression tests
