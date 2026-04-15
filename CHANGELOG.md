# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and the project follows Semantic Versioning where practical.

## [Unreleased]

## [0.2.13] - 2026-04-15

### Added
- Added a readonly HTML export flow that packages the current map into a standalone viewer page with the desktop template, drag navigation, and zoom browsing for shared review
- Added persisted desktop export preferences so repeated exports reuse the latest destination and related settings instead of forcing users to reconfigure each time

### Changed
- Improved the desktop editor top toolbar status area, search flow, and workspace guidance copy so common actions are easier to discover during day-to-day editing
- Deferred secondary editor plugin mounting and prepared the AI chat renderer on demand to reduce startup pressure on the main interaction path
- Expanded release verification coverage so behavior suites now include startup performance and remediation regressions as part of the standard release gate

### Fixed
- Hardened HTML export generation against unsafe SVG/script serialization paths and replaced fragile inline HTML writes with DOM-based rendering in fallback flows
- Prevented startup failure screens from writing raw `innerHTML`, reducing injection risk in the desktop bootstrap fallback
- Tightened desktop release workflow checks to validate packaged artifact naming before publishing, making tag-triggered release runs fail earlier on malformed outputs

## [0.2.11] - 2026-04-06

### Changed
- Added editable canvas background presets for the desktop editor with blank, dots, and grid styles stored as a global preference
- Moved editor background rendering onto an isolated overlay layer so runtime inline styles no longer hide the preset texture

### Fixed
- Corrected the grid background preset to render intersecting horizontal and vertical lines instead of only horizontal rules
- Hardened the macOS release workflow to preflight Apple certificates with real `security import` / keychain checks before handing signing config to Tauri

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
