# Release Template - IAZ Dashboard

Use this template when creating a new GitHub release.

---

## Release Title Format

```
v{VERSION} - {RELEASE_NAME}
```

**Examples:**
- `v1.0.0 - Production Release`
- `v1.1.0 - Plugin Enhancements`
- `v1.0.1 - Bug Fixes`

---

## Release Description Template

```markdown
# IAZ Dashboard v{VERSION} - {RELEASE_NAME} {EMOJI}

{Brief description of this release}

## 🚀 Highlights

- **Feature 1**: Description
- **Feature 2**: Description
- **Feature 3**: Description

## ✨ New Features

- Feature A (#123)
- Feature B (#124)
- Feature C (#125)

## 🐛 Bug Fixes

- Fixed bug X (#126)
- Fixed bug Y (#127)
- Fixed bug Z (#128)

## 📈 Improvements

- Improvement 1 (#129)
- Improvement 2 (#130)

## ⚠️ Breaking Changes

{If any, list them here. Otherwise remove this section.}

- Breaking change 1
- Breaking change 2

## 📦 Installation

### npm

```bash
npm install iaz-dashboard@{VERSION}
```

### yarn

```bash
yarn add iaz-dashboard@{VERSION}
```

### pnpm

```bash
pnpm add iaz-dashboard@{VERSION}
```

### CDN

#### unpkg
```html
<link rel="stylesheet" href="https://unpkg.com/iaz-dashboard@{VERSION}/dist/iaz-dashboard.css">
<script src="https://unpkg.com/iaz-dashboard@{VERSION}/dist/iaz-dashboard.umd.js"></script>
```

#### jsDelivr
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/iaz-dashboard@{VERSION}/dist/iaz-dashboard.css">
<script src="https://cdn.jsdelivr.net/npm/iaz-dashboard@{VERSION}/dist/iaz-dashboard.umd.js"></script>
```

## 📚 Documentation

- [Getting Started](https://github.com/yi00it/iaz-dashboard#quick-start)
- [API Reference](https://github.com/yi00it/iaz-dashboard#api)
- [Plugin System](https://github.com/yi00it/iaz-dashboard/blob/main/PLUGIN-SYSTEM.md)
- [Testing Guide](https://github.com/yi00it/iaz-dashboard/blob/main/TESTING.md)
- [Publishing Guide](https://github.com/yi00it/iaz-dashboard/blob/main/PUBLISHING.md)

## 📝 Full Changelog

See [CHANGELOG.md](https://github.com/yi00it/iaz-dashboard/blob/main/CHANGELOG.md) for complete version history.

## 🙏 Contributors

Thank you to all contributors who made this release possible!

{List contributors or use: }
A special thanks to everyone who contributed to this release: @username1, @username2

## 📊 Stats

- **Total Tests**: {number}
- **Test Coverage**: {percentage}%
- **Bundle Size**: ~{size} KB (minified + gzipped)
- **Zero Dependencies**: ✅

## 🐛 Bug Reports

Found a bug? Please report it:
- [GitHub Issues](https://github.com/yi00it/iaz-dashboard/issues)
- [npm Package](https://www.npmjs.com/package/iaz-dashboard)

## 💬 Community

- [Discussions](https://github.com/yi00it/iaz-dashboard/discussions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/iaz-dashboard)

---

**Full Diff**: https://github.com/yi00it/iaz-dashboard/compare/v{PREVIOUS_VERSION}...v{VERSION}
```

---

## Example: v1.0.0 Release

```markdown
# IAZ Dashboard v1.0.0 - Production Release 🎉

First stable production release of IAZ Dashboard! A modern, zero-dependency dashboard grid builder with comprehensive features and excellent test coverage.

## 🚀 Highlights

- **Zero Dependencies**: Pure Vanilla JavaScript, no external dependencies
- **Full TypeScript Support**: Complete type definitions included
- **Comprehensive Testing**: 177 tests with 76% coverage
- **Plugin System**: Extensible architecture with 3 built-in plugins
- **6 Theme Presets**: Including dark mode, minimal, colorful, glass, and neon
- **Responsive Breakpoints**: Mobile-first design with automatic layout switching

## ✨ New Features

### Core Features (v0.1.0 - v0.7.0)
- ✅ Grid engine with collision detection and auto-positioning
- ✅ Drag & drop with pointer events API
- ✅ Resize handles (8-point: corners + edges)
- ✅ Responsive breakpoint system
- ✅ Custom rendering hooks
- ✅ Theme system with 6 presets
- ✅ Plugin architecture

### Built-in Plugins
- **Save Plugin**: Auto-save to localStorage with debouncing
- **Constraints Plugin**: Validation rules for widgets
- **Snaplines Plugin**: Visual alignment guides

### Testing Infrastructure
- Vitest test framework with jsdom
- GitHub Actions CI/CD pipeline
- Coverage reporting
- 177 comprehensive tests

## 📦 Installation

### npm

```bash
npm install iaz-dashboard
```

### CDN

#### unpkg
```html
<link rel="stylesheet" href="https://unpkg.com/iaz-dashboard@1.0.0/dist/iaz-dashboard.css">
<script src="https://unpkg.com/iaz-dashboard@1.0.0/dist/iaz-dashboard.umd.js"></script>
```

#### jsDelivr
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/iaz-dashboard@1.0.0/dist/iaz-dashboard.css">
<script src="https://cdn.jsdelivr.net/npm/iaz-dashboard@1.0.0/dist/iaz-dashboard.umd.js"></script>
```

## 📚 Documentation

- [Getting Started](https://github.com/yi00it/iaz-dashboard#quick-start)
- [API Reference](https://github.com/yi00it/iaz-dashboard#api)
- [Plugin System](https://github.com/yi00it/iaz-dashboard/blob/main/PLUGIN-SYSTEM.md)
- [Testing Guide](https://github.com/yi00it/iaz-dashboard/blob/main/TESTING.md)
- [Publishing Guide](https://github.com/yi00it/iaz-dashboard/blob/main/PUBLISHING.md)

## 📝 Full Changelog

See [CHANGELOG.md](https://github.com/yi00it/iaz-dashboard/blob/main/CHANGELOG.md) for complete version history.

## 📊 Stats

- **Total Tests**: 177
- **Test Coverage**: 76%
- **Bundle Size**: ~11 KB (minified + gzipped)
- **Zero Dependencies**: ✅
- **TypeScript**: Ready

## 🐛 Bug Reports

Found a bug? Please report it:
- [GitHub Issues](https://github.com/yi00it/iaz-dashboard/issues)
- [npm Package](https://www.npmjs.com/package/iaz-dashboard)

---

**Full Diff**: https://github.com/yi00it/iaz-dashboard/compare/v0.7.0...v1.0.0
```

---

## Emoji Guide

Use these emojis for different types of releases:

- 🎉 Major releases (1.0.0, 2.0.0)
- ✨ Minor releases with new features (1.1.0, 1.2.0)
- 🐛 Patch releases with bug fixes (1.0.1, 1.0.2)
- ⚡ Performance improvements
- 🔒 Security fixes
- 📝 Documentation updates
- 🎨 Style/UI updates
- ♿ Accessibility improvements
