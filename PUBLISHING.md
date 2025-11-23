# Publishing Guide - IAZ Dashboard

This guide covers publishing IAZ Dashboard to npm and creating GitHub releases.

## Table of Contents

1. [Pre-Publication Checklist](#pre-publication-checklist)
2. [Publishing to npm](#publishing-to-npm)
3. [Creating GitHub Releases](#creating-github-releases)
4. [CDN Setup](#cdn-setup)
5. [Post-Publication Tasks](#post-publication-tasks)

---

## Pre-Publication Checklist

Before publishing, ensure all items are complete:

### Code Quality
- [ ] All tests passing (`npm run test:run`)
- [ ] Type checking passes (`npm run typecheck`)
- [ ] Build succeeds (`npm run build`)
- [ ] No linting errors
- [ ] Code reviewed and approved

### Documentation
- [ ] README.md updated with correct version
- [ ] CHANGELOG.md updated with release notes
- [ ] All examples working
- [ ] API documentation accurate
- [ ] Migration guide complete (if needed)

### Package Configuration
- [ ] package.json version updated
- [ ] Repository URL correct
- [ ] Keywords optimized for npm search
- [ ] LICENSE file present
- [ ] .npmignore configured correctly

### Version Management
- [ ] Version number follows semantic versioning
- [ ] Git tags created for version
- [ ] No uncommitted changes

---

## Publishing to npm

### First Time Setup

1. **Create npm account** (if you don't have one)
   ```bash
   # Visit https://www.npmjs.com/signup
   ```

2. **Login to npm**
   ```bash
   npm login
   ```

   Enter your credentials when prompted.

3. **Verify you're logged in**
   ```bash
   npm whoami
   ```

### Publishing Process

#### Step 1: Update Version

Update the version in `package.json`:

```bash
# For patch release (0.0.x)
npm version patch

# For minor release (0.x.0)
npm version minor

# For major release (x.0.0)
npm version major
```

This will:
- Update package.json
- Create a git commit
- Create a git tag

#### Step 2: Update CHANGELOG

Add release notes to `CHANGELOG.md`:

```markdown
## [1.0.0] - 2025-11-24

### Added
- Feature 1
- Feature 2

### Changed
- Change 1

### Fixed
- Bug fix 1
```

#### Step 3: Build the Package

```bash
npm run build
```

Verify the build output:
```bash
ls -lh dist/
```

Expected files:
- `iaz-dashboard.css` (~7 KB)
- `iaz-dashboard.esm.js` (~46 KB)
- `iaz-dashboard.umd.js` (~32 KB)
- `index.d.ts` (~11 KB)
- Source maps

#### Step 4: Test the Package Locally

Preview what will be published:

```bash
npm pack --dry-run
```

Test the package in a local project:

```bash
# Create tarball
npm pack

# In another project
npm install /path/to/iaz-dashboard-1.0.0.tgz
```

#### Step 5: Publish to npm

**For production release:**

```bash
npm publish
```

**For beta/alpha releases:**

```bash
# Beta release
npm publish --tag beta

# Alpha release
npm publish --tag alpha
```

**For scoped packages** (if using @username/iaz-dashboard):

```bash
# Public scoped package
npm publish --access public

# Private scoped package (requires paid npm account)
npm publish --access restricted
```

#### Step 6: Verify Publication

1. **Check on npm**
   ```
   https://www.npmjs.com/package/iaz-dashboard
   ```

2. **Test installation**
   ```bash
   npm install iaz-dashboard
   ```

3. **Check unpkg CDN** (available immediately)
   ```
   https://unpkg.com/iaz-dashboard@1.0.0/dist/
   ```

4. **Check jsDelivr CDN** (available after ~5 minutes)
   ```
   https://cdn.jsdelivr.net/npm/iaz-dashboard@1.0.0/dist/
   ```

---

## Creating GitHub Releases

### Step 1: Push Changes

```bash
# Commit all changes
git add .
git commit -m "chore: prepare v1.0.0 release"

# Push commits and tags
git push origin main
git push origin --tags
```

### Step 2: Create GitHub Release

1. **Go to GitHub repository**
   ```
   https://github.com/yi00it/iaz-dashboard/releases
   ```

2. **Click "Draft a new release"**

3. **Fill in release details:**

   **Tag version:** `v1.0.0`

   **Release title:** `v1.0.0 - Production Release`

   **Description:**
   ```markdown
   # IAZ Dashboard v1.0.0 - Production Release 🎉

   First stable production release of IAZ Dashboard!

   ## 🚀 Highlights

   - **Zero Dependencies**: Pure Vanilla JavaScript
   - **Full TypeScript Support**: Complete type definitions
   - **Comprehensive Testing**: 177 tests with 76% coverage
   - **Plugin System**: Extensible architecture
   - **6 Theme Presets**: Including dark mode, minimal, colorful, glass, and neon
   - **Responsive Breakpoints**: Mobile-first design

   ## 📦 Installation

   ```bash
   npm install iaz-dashboard
   ```

   Or via CDN:
   ```html
   <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/iaz-dashboard@1.0.0/dist/iaz-dashboard.css">
   <script src="https://cdn.jsdelivr.net/npm/iaz-dashboard@1.0.0/dist/iaz-dashboard.umd.js"></script>
   ```

   ## 📚 Documentation

   - [Getting Started](https://github.com/yi00it/iaz-dashboard#quick-start)
   - [API Documentation](https://github.com/yi00it/iaz-dashboard#api)
   - [Plugin System](https://github.com/yi00it/iaz-dashboard/blob/main/PLUGIN-SYSTEM.md)
   - [Testing Guide](https://github.com/yi00it/iaz-dashboard/blob/main/TESTING.md)

   ## 📝 Full Changelog

   See [CHANGELOG.md](https://github.com/yi00it/iaz-dashboard/blob/main/CHANGELOG.md) for complete version history.

   ## 🐛 Bug Reports

   Please report issues at: https://github.com/yi00it/iaz-dashboard/issues
   ```

4. **Attach assets** (optional):
   - Pre-built dist files
   - Documentation PDFs
   - Example projects

5. **Publish release**

---

## CDN Setup

After npm publication, your package is automatically available on these CDNs:

### unpkg

**Format:**
```
https://unpkg.com/iaz-dashboard@1.0.0/dist/[file]
```

**Examples:**
```html
<!-- CSS -->
<link rel="stylesheet" href="https://unpkg.com/iaz-dashboard@1.0.0/dist/iaz-dashboard.css">

<!-- UMD Script -->
<script src="https://unpkg.com/iaz-dashboard@1.0.0/dist/iaz-dashboard.umd.js"></script>

<!-- ESM -->
<script type="module">
  import { IAZDashboard } from 'https://unpkg.com/iaz-dashboard@1.0.0/dist/iaz-dashboard.esm.js';
</script>
```

### jsDelivr

**Format:**
```
https://cdn.jsdelivr.net/npm/iaz-dashboard@1.0.0/dist/[file]
```

**Examples:**
```html
<!-- CSS -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/iaz-dashboard@1.0.0/dist/iaz-dashboard.css">

<!-- UMD Script -->
<script src="https://cdn.jsdelivr.net/npm/iaz-dashboard@1.0.0/dist/iaz-dashboard.umd.js"></script>

<!-- ESM -->
<script type="module">
  import { IAZDashboard } from 'https://cdn.jsdelivr.net/npm/iaz-dashboard@1.0.0/dist/iaz-dashboard.esm.js';
</script>
```

### Version-less URLs (Latest)

Always get the latest version:

```html
<!-- unpkg -->
<link rel="stylesheet" href="https://unpkg.com/iaz-dashboard/dist/iaz-dashboard.css">
<script src="https://unpkg.com/iaz-dashboard/dist/iaz-dashboard.umd.js"></script>

<!-- jsDelivr -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/iaz-dashboard/dist/iaz-dashboard.css">
<script src="https://cdn.jsdelivr.net/npm/iaz-dashboard/dist/iaz-dashboard.umd.js"></script>
```

**⚠️ Warning**: Version-less URLs always point to the latest version, which may introduce breaking changes. Use versioned URLs for production.

---

## Post-Publication Tasks

### 1. Update Documentation

- [ ] Update README with npm install instructions
- [ ] Update examples to use published package
- [ ] Add CDN usage examples
- [ ] Update version numbers in docs

### 2. Announce Release

**npm:**
- Package is now visible on npm

**GitHub:**
- Release created with notes

**Social Media (optional):**
- Twitter/X
- Reddit (r/javascript, r/webdev)
- Dev.to
- Hacker News

**Example announcement:**

```
🎉 IAZ Dashboard v1.0.0 is now available!

A modern, zero-dependency dashboard grid builder with drag & drop, resizing, and responsive breakpoints.

✨ Zero dependencies
🎯 Full TypeScript support
🧩 Extensible plugin system
🎨 6 beautiful themes

npm install iaz-dashboard

https://github.com/yi00it/iaz-dashboard
```

### 3. Submit to Package Directories

- [ ] [npms.io](https://npms.io/) (automatic)
- [ ] [libraries.io](https://libraries.io/) (automatic)
- [ ] [JS.ORG](https://js.org/) (manual submission)

### 4. Create Demo Site (optional)

Consider creating a demo/documentation site:
- GitHub Pages
- Netlify
- Vercel
- CodeSandbox

### 5. Monitor

- [ ] Watch npm download stats
- [ ] Monitor GitHub issues
- [ ] Check for bug reports
- [ ] Respond to questions

---

## Updating After Publication

### Patch Release (1.0.x)

For bug fixes:

```bash
# Fix the bugs
# Update tests
npm version patch
npm run build
npm publish
git push origin main --tags
```

### Minor Release (1.x.0)

For new features (backwards compatible):

```bash
# Add new features
# Update docs and tests
npm version minor
npm run build
npm publish
git push origin main --tags
```

### Major Release (x.0.0)

For breaking changes:

```bash
# Make breaking changes
# Update migration guide
npm version major
npm run build
npm publish
git push origin main --tags
```

---

## Troubleshooting

### "You do not have permission to publish"

**Solution:**
```bash
npm login
npm whoami  # Verify logged in
```

### "Package name already exists"

**Options:**
1. Choose a different name
2. Use a scoped package: `@username/iaz-dashboard`
3. Contact npm support if you own the name

### "Version already published"

You cannot republish the same version. Update version:
```bash
npm version patch
npm publish
```

### "prepublishOnly script failed"

Fix the failing tests/build:
```bash
npm run typecheck  # Check types
npm run test:run   # Run tests
npm run build      # Check build
```

---

## Unpublishing (Use with Caution)

**⚠️ Warning**: Unpublishing can break dependent projects!

### Within 72 hours

```bash
npm unpublish iaz-dashboard@1.0.0
```

### After 72 hours

You can only deprecate:

```bash
npm deprecate iaz-dashboard@1.0.0 "Deprecated: Use v1.0.1 instead"
```

---

## Resources

- [npm Documentation](https://docs.npmjs.com/)
- [Semantic Versioning](https://semver.org/)
- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github)

---

## Support

For questions or issues:
- GitHub Issues: https://github.com/yi00it/iaz-dashboard/issues
- npm: https://www.npmjs.com/package/iaz-dashboard
