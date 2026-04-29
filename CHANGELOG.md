# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and the project follows Semantic Versioning where practical.

## [Unreleased]

## [0.2.16] - 2026-04-29

### Added
- Added the shipping desktop flowchart workspace with business-oriented node templates, canvas backgrounds, minimap navigation, reconnect handles, edge labels, resize controls, and inspector-driven editing on the main application path
- Added direct orthogonal route editing for flowchart edges, including bend dragging, segment dragging, single-bend preference, and automatic collapse of redundant bends when users pull routes back onto a straight lane
- Added broader flowchart regression coverage around template previews, orthogonal routing, export bounds, anchor placement, and manual route cleanup so the editor can keep evolving without reintroducing the same pathing failures

### Changed
- Refined flowchart routing and layout behavior across editing, preview, and export so arrows stay pointed at the target block, labels remain readable, minimap coverage matches the real canvas, and large business diagrams keep a cleaner overall shape
- Reworked flowchart export-bound calculation to include labels, arrows, and long detours instead of sizing only from nodes, which makes complex SVG and image export results much less likely to clip content
- Improved template preview arrangement and node overlap handling so denser flowchart templates remain legible before insertion and better match the structured layout users expect in commercial diagram tools
- Hardened the desktop release pipeline so Windows and Linux bundle builds now reuse the intended release config, publish curated changelog text as the release body, and validate local bundle artifacts with rules that match real runner outputs

### Fixed
- Fixed several flowchart edge-editing cases where repeated drag adjustments could leave unnecessary double bends, unstable return paths, or misaligned route recovery after moving nodes
- Fixed minimap range calculation so connector paths and arrow markers participate in overview bounds instead of disappearing near the edges of larger diagrams
- Fixed flowchart edge-label alignment so centered labels render more consistently on the canvas and in exported output
- Fixed the release workflow bug that turned wildcard bundle paths such as `*.exe`, `*.deb`, and `*.AppImage` into invalid regular expressions during post-build verification, which was the remaining cause of the failed Windows and Linux release jobs

## [0.2.15] - 2026-04-29

### Added
- Added a substantially upgraded desktop flowchart editing experience with denser business-ready templates, richer minimap feedback, cleaner edge label rendering, and direct route-shape editing that better fits everyday diagram work
- Added support for dragging flowchart route segments and intermediate bends as first-class controls so users can refine orthogonal paths without fighting the automatic router
- Added more regression coverage around flowchart routing, template preview layout, export bounds, manual bend simplification, and anchor handling to keep the new editor path stable as iteration continues

### Changed
- Refined flowchart routing to treat manual route points as structured editor state instead of a fragile lane override, which makes single-bend preference, bend collapse, and route cleanup behave more predictably under repeated edits
- Improved flowchart SVG/export layout generation so labels, arrows, and long detours contribute to export bounds correctly and complex diagrams are less likely to be clipped in preview or exported output
- Tightened flowchart preview/template arrangement to reduce accidental overlap in compact previews and keep larger business templates readable before insertion
- Updated the desktop release workflow to reuse curated changelog notes as the published release body, keep Windows/Linux release config aligned during bundle builds, and verify bundled outputs using the right local artifact rules

### Fixed
- Fixed several flowchart routing cases where orthogonal edges could keep unnecessary extra bends, lose the expected single-turn path, or drift away from visually aligned horizontal/vertical returns after drag adjustments
- Fixed minimap coverage so edge paths and arrow markers remain visible in overview calculations instead of disappearing from the navigation frame under larger diagrams
- Fixed flowchart edge label alignment and interaction details so centered labels render more consistently during preview, export, and direct manipulation
- Fixed release packaging failures in tag-triggered GitHub Actions where Windows installer, Windows ARM64 installer, and Linux bundle jobs built successfully but were incorrectly failed by post-build artifact validation

## [0.2.14] - 2026-04-29

### Added
- Added the desktop flowchart editor to the mainline build with node templates, canvas backgrounds, minimap navigation, edge labels, reconnect handles, resize controls, inspector panels, and multi-step editing workflows
- Added full flowchart document support across desktop save, save as, recovery drafts, import from mind map files, AI generation, HTML export, and image/SVG export flows
- Added a larger set of structured business flowchart templates, including complex layouts used for interaction and routing regression coverage

### Changed
- Synced desktop dark mode behavior across home, editor, export, and workspace settings so theme switching now stays consistent throughout the app
- Refined the desktop export workflow with persistent export preferences, richer preview behavior, and readonly HTML delivery suitable for sharing and review
- Consolidated flowchart-side settings, selection behavior, edge property editing, template browsing, and toolbar actions to make the editor feel closer to a primary production workflow instead of a prototype surface
- Removed macOS desktop packaging from the release pipeline so tag-triggered GitHub Actions now build and publish Windows and Linux artifacts only
- Trimmed desktop packaging metadata to match the supported platforms, including Tauri bundle descriptions, release docs, and exposed build scripts
- Updated GitHub Release publishing so the action reuses the curated changelog entry as the release body instead of relying only on autogenerated notes

### Fixed
- Reworked flowchart connection routing so edges stay on the four fixed anchor points, avoid passing through nodes, keep arrows oriented toward the target block, and prefer natural bends when space allows
- Improved flowchart dragging, auto-scroll, snapping, reconnect, label placement, and history persistence so common editing actions no longer feel unstable under dense diagrams
- Hardened flowchart route scoring and regression coverage to prevent single-bend optimizations, short-distance preview routing, and obstacle avoidance from regressing together
- Tightened desktop session, recovery, local file, and export state handling so switching between mind map and flowchart documents does not silently drop mode-specific data

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
