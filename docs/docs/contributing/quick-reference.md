# Quick Reference Guide

A handy reference for validation requirements and release processes when contributing to GhanaAPI.

## 🌿 Branch Naming

### Valid Patterns

```bash
feature/description          # New features
bugfix/description          # Bug fixes
hotfix/description          # Critical fixes
chore/description           # Maintenance
docs/description            # Documentation
refactor/description        # Code improvements
test/description            # Test additions
ci/description             # CI/CD changes
```

### Examples

```bash
✅ feature/address-bulk-validation
✅ bugfix/exchange-rate-timeout
✅ docs/api-examples
✅ chore/update-dependencies

❌ my-new-feature
❌ Feature/MyNewFeature
❌ fix-bug
```

## 💬 Commit Messages

### Format

```
type(scope): description

# Examples:
feat: add address validation endpoint
fix: resolve exchange rate timeout
docs: update API documentation
chore: upgrade dependencies
```

### Valid Types

| Type       | Use Case         |
| ---------- | ---------------- |
| `feat`     | New features     |
| `fix`      | Bug fixes        |
| `docs`     | Documentation    |
| `style`    | Code style       |
| `refactor` | Code refactoring |
| `test`     | Tests            |
| `chore`    | Maintenance      |
| `ci`       | CI/CD changes    |
| `perf`     | Performance      |
| `build`    | Build system     |
| `revert`   | Revert changes   |

## 📝 Pull Request

### Title Format

```bash
feat: add bulk address validation endpoint
fix: resolve caching issue with exchange rates
docs: update contributing guidelines
```

### Requirements

- ✅ Follow conventional commits format
- ✅ Start with lowercase letter
- ✅ No period at end
- ✅ At least 10 characters

### Description Requirements

- ✅ Minimum 20 characters
- ✅ Clear explanation of changes
- ✅ Reference related issues

## 🚀 Release Management

### Version Bump via GitHub UI

1. Go to **Actions** → **Version Bump**
2. Click **"Run workflow"**
3. Select version type:
   - `patch` - Bug fixes (0.2.1 → 0.2.2)
   - `minor` - New features (0.2.1 → 0.3.0)
   - `major` - Breaking changes (0.2.1 → 1.0.0)
   - `prerelease` - Alpha/beta versions

### Version Bump via CLI

```bash
# Patch release
gh workflow run version-bump.yml -f version_type=patch

# Minor release
gh workflow run version-bump.yml -f version_type=minor

# Major release
gh workflow run version-bump.yml -f version_type=major

# Alpha prerelease
gh workflow run version-bump.yml -f version_type=prerelease -f prerelease_identifier=alpha
```

### Manual Version Update

```bash
cd backend
npm version patch --no-git-tag-version
git add package.json
git commit -m "chore: bump version to v0.2.2"
git push origin main
```

## 🔧 Quick Fixes

### Fix Branch Name

```bash
git branch -m feature/new-descriptive-name
git push origin -u feature/new-descriptive-name
git push origin --delete old-branch-name
```

### Fix Last Commit Message

```bash
git commit --amend -m "feat: add new validation feature"
git push --force-with-lease
```

### Fix Multiple Commit Messages

```bash
git rebase -i HEAD~3
# Change 'pick' to 'reword' for commits to fix
```

## 🎯 Common Commands

### Development Setup

```bash
git clone https://github.com/YOUR_USERNAME/GhanaAPI.git
cd GhanaAPI/backend
npm install
npm run start:dev
```

### Testing

```bash
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage
```

### Branch Management

```bash
git checkout -b feature/my-feature
git add .
git commit -m "feat: add new feature"
git push origin feature/my-feature
```

## 🚨 Validation Errors

### Branch Name Invalid

**Error**: Branch doesn't follow naming convention
**Fix**: Rename branch using proper prefix

### Commit Message Invalid

**Error**: Doesn't follow conventional format
**Fix**: Use `git commit --amend` or `git rebase -i`

### PR Title Invalid

**Error**: Doesn't follow conventional format
**Fix**: Edit PR title in GitHub UI

### PR Description Too Short

**Error**: Less than 20 characters
**Fix**: Add more detailed description

## 📋 Validation Checklist

Before submitting a PR, ensure:

- [ ] Branch name follows convention (`feature/`, `bugfix/`, etc.)
- [ ] All commit messages use conventional format
- [ ] PR title follows conventional format
- [ ] PR description is at least 20 characters
- [ ] Tests pass (`npm test`)
- [ ] Code builds successfully (`npm run build`)
- [ ] Documentation updated if needed

## 🔗 Quick Links

- [Full Validation Guide](./validation-workflows)
- [Release Management Guide](./release-management)
- [Contributing Overview](./overview)
- [GitHub Repository](https://github.com/teebhagg/GhanaAPI)
- [GitHub Actions](https://github.com/teebhagg/GhanaAPI/actions)

---

:::tip Save Time
Bookmark this page for quick reference while contributing to GhanaAPI!
:::

:::info Need Help?
If validation fails, check the specific error message and use the fixes above, or ask for help in [GitHub Discussions](https://github.com/teebhagg/GhanaAPI/discussions).
:::
