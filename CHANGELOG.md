# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2025-11-24

### Added
- Comprehensive test suite with 177 tests using Vitest (100% pass rate)
- GitHub Actions CI/CD pipeline
- Test coverage reporting
- Detailed testing documentation (TESTING.md)
- `getWidget(id)` method to retrieve widgets by ID
- `clear()` method to remove all widgets
- `serialize()` and `load(json)` methods for JSON serialization
- `before:widget:add` event for plugin validation
- `context.state` and `context.events` properties to PluginContext
- `float` option as alias for `floatMode`
- `widgets` option in constructor for initial widget loading
- Snaplines plugin DOM structure with wrapper container

### Changed
- Dashboard constructor now accepts partial/no options with sensible defaults (columns=12, rowHeight=60)
- `loadState()` now merges with existing state instead of replacing it
- `widget:remove` event now emits widget ID instead of widget object
- ConstraintsPlugin now emits specific constraint events (`constraint:maxWidgets`, `constraint:minSize`, etc.)
- ConstraintsPlugin properly blocks invalid widgets before they're added to state
- Snaplines plugin creates elements immediately on registration
- Improved documentation structure

### Fixed
- GridEngine collision resolution now correctly skips the moved widget
- TypeScript type errors in Dashboard and plugin system
- Plugin context API consistency across all plugins
- Test compatibility with actual API implementation

## [1.0.0] - 2025-11-24

### Added
- Production release with all core features
- npm package publication
- CDN availability (jsDelivr, unpkg)

## [0.7.0] - 2025-11-24

### Added
- **Plugin System**: Context-based plugin architecture
- **Save Plugin**: Auto-save to localStorage with debouncing
- **Constraints Plugin**: Widget validation rules (max widgets, min/max sizes, restricted areas)
- **Snaplines Plugin**: Visual alignment guides during drag/resize
- Plugin registration via `.use()` method
- Plugin context with full state and event access
- Plugin documentation (PLUGIN-SYSTEM.md)

### Changed
- Enhanced event system for plugin integration
- Improved API for state management

## [0.6.0] - 2025-11-23

### Added
- **Custom Rendering**: `renderWidget` and `renderWidgetFrame` hooks
- **Theme System**: 6 built-in theme presets
  - Default (light)
  - Dark mode
  - Minimal
  - Colorful
  - Glass (glassmorphism)
  - Neon (cyberpunk)
- **CSS Variables**: 20+ customizable CSS variables
- Theme switching examples
- Custom rendering documentation

### Changed
- Improved CSS architecture for theming
- Enhanced documentation with theme examples

## [0.5.0] - 2025-11-22

### Added
- **Responsive Breakpoints**: Mobile-first breakpoint system
- Automatic layout switching based on viewport
- Per-breakpoint layout persistence
- Breakpoint configuration with custom columns
- `breakpoint:change` event
- Responsive examples and documentation

### Changed
- Grid system now supports dynamic column counts
- Improved layout adaptation logic

## [0.4.0] - 2025-11-21

### Added
- **Resize Engine**: Full widget resizing functionality
- 8-point resize handles (corners + edges)
- Collision-safe resizing
- Min/max size constraints per widget
- `resize:start`, `resize:move`, `resize:end`, `resize:cancel` events
- Resize preview element
- `noResize` widget property

### Changed
- Enhanced grid engine for resize operations
- Improved collision resolution algorithm

## [0.3.0] - 2025-11-20

### Added
- **Drag & Drop Engine**: Pointer-based drag functionality
- Ghost element during drag
- Grid-snapped preview element
- Auto-scroll when dragging near edges
- Touch device support via Pointer Events API
- `drag:start`, `drag:move`, `drag:end`, `drag:cancel` events
- `noMove` widget property

### Changed
- Improved event system architecture
- Enhanced DOM rendering performance

## [0.2.0] - 2025-11-19

### Added
- **Grid Engine**: Core grid layout algorithms
- AABB collision detection
- Auto-positioning for new widgets
- Layout compaction (float mode)
- Collision resolution (push down/right)
- Widget sorting algorithms
- Grid bounds checking
- Static utilities for grid operations

### Changed
- Improved widget placement logic
- Enhanced grid coordinate system

## [0.1.0] - 2025-11-18

### Added
- Initial project setup
- TypeScript configuration
- Vite build system
- Basic widget structure
- Core dashboard class skeleton
- Event emitter system
- Type definitions
- Basic rendering system
- UMD + ESM build outputs
- CSS foundation
- Documentation structure (README, architecture docs)

### Infrastructure
- Package configuration
- Development server
- Build pipeline
- Type checking

## [Pre-release]

### Project Rename
- Renamed from "Saharos Dashboard" to "IAZ Dashboard"
- Updated all references and prefixes
- CSS classes: `sdb-*` → `iazd-*`
- Package name: `saharos-kanban` → `iaz-dashboard`
- Migration documentation provided

---

## Version History Summary

- **v0.7.0**: Plugin System
- **v0.6.0**: Custom Rendering & Themes
- **v0.5.0**: Responsive Breakpoints
- **v0.4.0**: Resize Engine
- **v0.3.0**: Drag & Drop
- **v0.2.0**: Grid Engine
- **v0.1.0**: Foundation

## Upcoming

### [1.0.0] - Planned

**Production Release** - First stable release

#### Planned Additions
- npm package publication
- CDN availability (jsDelivr, unpkg)
- Performance optimizations
- Enhanced documentation website
- Migration guide from GridStack.js
- Production-ready examples

#### Quality Improvements
- ≥90% test coverage
- Performance benchmarks
- Accessibility enhancements
- Browser compatibility testing
- Bundle size optimization

#### Documentation
- Interactive API documentation
- Live playground/sandbox
- Video tutorials
- Community guidelines
- Contribution guide updates

---

## Links

- [GitHub Repository](https://github.com/yi00it/iaz-dashboard)
- [npm Package](https://www.npmjs.com/package/iaz-dashboard)
- [Documentation](./README.md)
- [Issues](https://github.com/yi00it/iaz-dashboard/issues)
