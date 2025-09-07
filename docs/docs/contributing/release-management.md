# Release Management

GhanaAPI uses automated release workflows to ensure consistent, reliable releases with proper versioning, testing, and documentation. This guide explains how releases work and how to create new releases.

## 🔄 Release Overview

Our release system supports two approaches:

1. **Automated Version Bump Workflow** - Recommended for team environments
2. **Manual Version Updates** - Quick approach for direct releases

Both approaches trigger the same automated release process, ensuring consistency regardless of how the version is updated.

## 📊 Semantic Versioning

GhanaAPI follows [Semantic Versioning (SemVer)](https://semver.org/) with the format `MAJOR.MINOR.PATCH`:

### Version Components

| Component      | When to Increment                          | Example                   |
| -------------- | ------------------------------------------ | ------------------------- |
| **MAJOR**      | Breaking changes that require user action  | `1.0.0` → `2.0.0`         |
| **MINOR**      | New features that are backward compatible  | `1.0.0` → `1.1.0`         |
| **PATCH**      | Bug fixes and minor updates                | `1.0.0` → `1.0.1`         |
| **PRERELEASE** | Alpha, beta, or release candidate versions | `1.0.0` → `1.0.1-alpha.1` |

### Version Examples

```json
{
  "version": "0.2.1" // Current version
}
```

**Possible Next Versions**:

- **Patch**: `0.2.2` (bug fixes)
- **Minor**: `0.3.0` (new features)
- **Major**: `1.0.0` (breaking changes)
- **Prerelease**: `0.2.2-alpha.1` (testing version)

## 🚀 Release Approaches

### Approach 1: Automated Version Bump (Recommended)

Use the automated workflow for a controlled, reviewable release process.

#### How It Works

1. **Trigger Workflow** via GitHub UI or CLI
2. **Select Version Type** (patch, minor, major, prerelease)
3. **Automatic Processing**:
   - Creates new branch (`version-bump/vX.Y.Z`)
   - Updates `backend/package.json`
   - Updates `CHANGELOG.md`
   - Creates Pull Request
4. **Review and Merge** the PR
5. **Automatic Release** triggers when merged to main

#### Using GitHub UI

1. **Navigate** to repository → **Actions** tab
2. **Select** "Version Bump" workflow
3. **Click** "Run workflow" button
4. **Configure** options:
   - **Version Type**: Choose from dropdown
     - `patch` - Bug fixes (0.2.1 → 0.2.2)
     - `minor` - New features (0.2.1 → 0.3.0)
     - `major` - Breaking changes (0.2.1 → 1.0.0)
     - `prerelease` - Alpha/beta (0.2.1 → 0.2.2-alpha.1)
   - **Prerelease Identifier** (if prerelease selected):
     - `alpha` - Early development
     - `beta` - Feature complete, testing
     - `rc` - Release candidate
5. **Click** "Run workflow"

#### Using GitHub CLI

```bash
# Patch release (bug fixes)
gh workflow run version-bump.yml -f version_type=patch

# Minor release (new features)
gh workflow run version-bump.yml -f version_type=minor

# Major release (breaking changes)
gh workflow run version-bump.yml -f version_type=major

# Alpha prerelease
gh workflow run version-bump.yml -f version_type=prerelease -f prerelease_identifier=alpha

# Beta prerelease
gh workflow run version-bump.yml -f version_type=prerelease -f prerelease_identifier=beta

# Release candidate
gh workflow run version-bump.yml -f version_type=prerelease -f prerelease_identifier=rc
```

#### Generated Pull Request

The workflow creates a PR with comprehensive information:

```markdown
## Version Bump: v0.2.2

**Type:** patch
**Previous Version:** 0.2.1
**New Version:** 0.2.2

### Changes

- ⬆️ Bumped backend version from `0.2.1` to `0.2.2`
- 📝 Updated CHANGELOG.md with version entry

### What happens next?

When this PR is merged to main, it will automatically trigger the release workflow to:

- Create a Git tag `v0.2.2`
- Generate a GitHub release with changelog
- Build and attach backend artifacts

---

_This PR was created automatically by the Version Bump workflow._
_Triggered by: @username_
```

### Approach 2: Manual Version Updates

Direct approach for quick releases or hotfixes.

#### How It Works

1. **Edit** `backend/package.json` manually
2. **Update** version number
3. **Commit and Push** to main branch
4. **Automatic Release** triggers immediately

#### Manual Process

```bash
# 1. Update version in package.json
cd backend
npm version patch --no-git-tag-version  # or minor, major

# 2. Commit changes
git add package.json
git commit -m "chore: bump version to v0.2.2"

# 3. Push to main (triggers release)
git push origin main
```

#### Version Update Commands

```bash
# Patch version (0.2.1 → 0.2.2)
npm version patch --no-git-tag-version

# Minor version (0.2.1 → 0.3.0)
npm version minor --no-git-tag-version

# Major version (0.2.1 → 1.0.0)
npm version major --no-git-tag-version

# Prerelease version (0.2.1 → 0.2.2-alpha.1)
npm version prerelease --preid=alpha --no-git-tag-version
```

## 🤖 Automatic Release Process

Regardless of the approach used, the same automated release workflow runs when a version change is detected in `main`.

### Release Workflow Steps

#### 1. Version Change Detection

- Monitors `backend/package.json` on main branch
- Compares current version with previous commit
- Only proceeds if version has changed

#### 2. Build and Test

```bash
# Install dependencies
npm ci

# Run test suite
npm run test
npm run test:e2e

# Build application
npm run build
```

#### 3. Changelog Generation

- Extracts commits since last version
- Formats as markdown release notes
- Includes commit hashes and messages

#### 4. Git Tag Creation

```bash
# Create and push version tag
git tag -a v0.2.2 -m "Release v0.2.2"
git push origin v0.2.2
```

#### 5. Build Artifacts

- Creates production build
- Packages as compressed archive
- Includes all necessary files

#### 6. GitHub Release

- Creates GitHub release page
- Attaches build artifacts
- Includes generated changelog
- Marks as prerelease if version contains alpha/beta/rc

### Release Artifacts

Each release includes:

- **Source Code** (automatic GitHub archive)
- **Backend Build** (`backend-build-v0.2.2.tar.gz`)
- **Release Notes** (generated from commits)
- **Version Information** (backend version, release date)

## 📋 Release Types and Use Cases

### When to Use Each Version Type

#### Patch Releases (0.2.1 → 0.2.2)

**Use for:**

- 🐛 Bug fixes
- 🔧 Security patches
- 📄 Documentation corrections
- 🎨 Code style improvements

**Examples:**

```bash
# Fix API timeout issue
npm version patch --no-git-tag-version

# Security vulnerability patch
gh workflow run version-bump.yml -f version_type=patch
```

#### Minor Releases (0.2.1 → 0.3.0)

**Use for:**

- ✨ New features
- 🚀 API enhancements
- 📊 Performance improvements
- 🛠️ New endpoints

**Examples:**

```bash
# Add new address validation endpoint
gh workflow run version-bump.yml -f version_type=minor

# Enhance exchange rate API
npm version minor --no-git-tag-version
```

#### Major Releases (0.2.1 → 1.0.0)

**Use for:**

- 💥 Breaking API changes
- 🔄 Major architecture changes
- 🗑️ Removing deprecated features
- 📝 Changing data formats

**Examples:**

```bash
# Breaking API changes
gh workflow run version-bump.yml -f version_type=major

# Remove deprecated endpoints
npm version major --no-git-tag-version
```

#### Prerelease Versions

**Use for:**

- 🧪 Testing new features
- 🔍 Beta releases
- 🚧 Release candidates

**Alpha (early development)**:

```bash
gh workflow run version-bump.yml -f version_type=prerelease -f prerelease_identifier=alpha
# Result: 0.2.1 → 0.2.2-alpha.1
```

**Beta (feature complete)**:

```bash
gh workflow run version-bump.yml -f version_type=prerelease -f prerelease_identifier=beta
# Result: 0.2.1 → 0.2.2-beta.1
```

**Release Candidate (final testing)**:

```bash
gh workflow run version-bump.yml -f version_type=prerelease -f prerelease_identifier=rc
# Result: 0.2.1 → 0.2.2-rc.1
```

## 🎯 Best Practices

### Release Planning

- **Plan releases** around feature completions
- **Group related changes** into single releases
- **Test thoroughly** before releasing
- **Document breaking changes** clearly

### Version Selection

- **Use patch** for urgent fixes
- **Use minor** for regular feature releases
- **Use major** sparingly for significant changes
- **Use prerelease** for testing and feedback

### Release Notes

- **Write clear descriptions** of changes
- **Include migration guides** for breaking changes
- **Link to relevant documentation**
- **Thank contributors**

### Testing Strategy

- **Run full test suite** before releasing
- **Test in staging environment**
- **Verify API compatibility**
- **Check documentation accuracy**

## 📝 Changelog Management

### Automatic Generation

The release workflow automatically generates changelogs from commit messages:

```markdown
## What's Changed

- feat: add bulk address validation endpoint (a1b2c3d)
- fix: resolve exchange rate timeout issue (d4e5f6g)
- docs: update API documentation examples (g7h8i9j)

**Backend Version:** 0.2.2
**Release Date:** 2024-01-15
```

### Manual Enhancement

You can enhance changelogs by:

1. **Editing release notes** after creation
2. **Adding context** and explanations
3. **Including breaking change warnings**
4. **Adding upgrade instructions**

### Conventional Commits Benefits

Using conventional commit messages enables:

- **Automatic changelog generation**
- **Semantic version suggestions**
- **Release note categorization**
- **Breaking change detection**

## 🚨 Troubleshooting

### Common Issues

#### Release Not Triggering

**Problem**: Version change not detected
**Solutions**:

- Ensure `backend/package.json` version changed
- Check that push was to `main` branch
- Verify workflow file is present and valid

#### Build Failures

**Problem**: Tests or build failing during release
**Solutions**:

- Run tests locally before releasing
- Check for missing dependencies
- Verify environment configuration

#### Version Conflicts

**Problem**: Version already exists
**Solutions**:

- Check existing tags and releases
- Use correct version increment
- Consider using prerelease versions

### Rollback Procedures

#### Rolling Back a Release

```bash
# 1. Delete the Git tag
git tag -d v0.2.2
git push origin --delete v0.2.2

# 2. Revert version in package.json
git revert <commit-hash>

# 3. Delete GitHub release (manual)
# Go to GitHub Releases and delete manually
```

#### Emergency Hotfix

```bash
# 1. Create hotfix branch from main
git checkout -b hotfix/critical-security-fix

# 2. Make necessary changes
git commit -m "fix: resolve critical security vulnerability"

# 3. Bump patch version
npm version patch --no-git-tag-version

# 4. Merge to main (triggers release)
git checkout main
git merge hotfix/critical-security-fix
git push origin main
```

## 📊 Release Metrics

### Tracking Success

Monitor release success through:

- **Build Success Rate**: Percentage of successful releases
- **Test Coverage**: Ensure tests pass before release
- **Deployment Time**: Monitor release workflow duration
- **User Feedback**: Track issues reported after releases

### Release Schedule

Consider establishing a regular release schedule:

- **Patch Releases**: As needed for bugs
- **Minor Releases**: Monthly or bi-weekly
- **Major Releases**: Quarterly or as needed
- **Prerelease**: Continuous for testing

## 📚 Additional Resources

- [Semantic Versioning Specification](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Releases Documentation](https://docs.github.com/en/repositories/releasing-projects-on-github)
- [npm version Command](https://docs.npmjs.com/cli/v8/commands/npm-version)

---

:::tip Release Strategy
For most changes, use the **automated version bump workflow** as it provides better visibility, review process, and documentation. Reserve manual updates for urgent hotfixes.
:::

:::warning Breaking Changes
Always use major version increments for breaking changes and provide clear migration documentation in release notes.
:::

:::info Need Help?
If you encounter issues with releases, check the GitHub Actions logs or ask for help in [GitHub Discussions](https://github.com/teebhagg/GhanaAPI/discussions).
:::
