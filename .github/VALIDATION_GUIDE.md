# 🛡️ Code Validation Guide

This repository uses automated validation to ensure consistent code quality, naming conventions, and contribution standards. This guide explains the validation rules and how to work with them.

## 📋 Table of Contents

- [Overview](#overview)
- [Branch Naming](#branch-naming)
- [Commit Messages](#commit-messages)
- [Pull Requests](#pull-requests)
- [Validation Workflows](#validation-workflows)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Examples](#examples)

## 🔍 Overview

Our validation system consists of three main components:

1. **Branch Name Validation** - Ensures branch names follow consistent patterns
2. **Commit Message Validation** - Enforces conventional commit format
3. **Pull Request Validation** - Validates PR titles, descriptions, and overall compliance

All validations run automatically via GitHub Actions and provide detailed feedback to help you fix any issues.

## 🌿 Branch Naming

### Supported Patterns

| Type              | Pattern                | Example                       | Description              |
| ----------------- | ---------------------- | ----------------------------- | ------------------------ |
| **Feature**       | `feature/description`  | `feature/user-authentication` | New functionality        |
| **Bug Fix**       | `bugfix/description`   | `bugfix/login-issue`          | Bug fixes                |
| **Hot Fix**       | `hotfix/description`   | `hotfix/security-patch`       | Critical/urgent fixes    |
| **Chore**         | `chore/description`    | `chore/update-deps`           | Maintenance tasks        |
| **Documentation** | `docs/description`     | `docs/api-guide`              | Documentation updates    |
| **Refactor**      | `refactor/description` | `refactor/user-service`       | Code restructuring       |
| **Tests**         | `test/description`     | `test/integration-tests`      | Test additions/updates   |
| **CI/CD**         | `ci/description`       | `ci/workflow-update`          | CI/CD improvements       |
| **Performance**   | `perf/description`     | `perf/optimize-queries`       | Performance improvements |
| **Build**         | `build/description`    | `build/webpack-config`        | Build system changes     |
| **Style**         | `style/description`    | `style/code-formatting`       | Code style/formatting    |

### Special Patterns

- **Release branches**: `release/v1.2.3`
- **Version bumps**: `version-bump/v1.2.3`
- **Jira integration**: `feature/PROJ-123-description`
- **Issue references**: `bugfix/456-fix-login`
- **Dependabot**: `dependabot/*` (auto-allowed)
- **Renovate**: `renovate/*` (auto-allowed)

### Branch Naming Rules

1. ✅ **Use lowercase letters, numbers, and hyphens only**
2. ✅ **Start and end with alphanumeric characters**
3. ✅ **Use hyphens to separate words**
4. ✅ **Keep descriptions concise but descriptive**
5. ❌ **Avoid underscores, spaces, or special characters**
6. ❌ **Don't use consecutive hyphens**

### Examples

```bash
# ✅ Good branch names
git checkout -b feature/oauth2-integration
git checkout -b bugfix/memory-leak-fix
git checkout -b docs/deployment-guide
git checkout -b chore/dependency-updates

# ❌ Bad branch names
git checkout -b Feature/OAuth2_Integration  # Wrong case, underscore
git checkout -b fix-something               # Missing type prefix
git checkout -b feature/                    # Empty description
git checkout -b my-random-branch           # No type prefix
```

## 📝 Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
type(optional-scope): description

[optional body]

[optional footer]
```

### Supported Types

| Type       | Description        | Example                                   |
| ---------- | ------------------ | ----------------------------------------- |
| `feat`     | New features       | `feat: add user registration`             |
| `fix`      | Bug fixes          | `fix: resolve login timeout issue`        |
| `docs`     | Documentation      | `docs: update API documentation`          |
| `style`    | Code style changes | `style: fix indentation in auth module`   |
| `refactor` | Code refactoring   | `refactor: extract user validation logic` |
| `test`     | Test changes       | `test: add unit tests for auth service`   |
| `chore`    | Maintenance        | `chore: update dependencies`              |
| `ci`       | CI/CD changes      | `ci: add automated testing workflow`      |
| `perf`     | Performance        | `perf: optimize database queries`         |
| `build`    | Build system       | `build: update webpack configuration`     |
| `revert`   | Revert changes     | `revert: undo feature X implementation`   |

### Scopes (Optional)

Use scopes to specify the area of change:

- `api` - Backend API changes
- `frontend` - Frontend changes
- `backend` - Backend changes
- `docs` - Documentation
- `ci` - CI/CD
- `test` - Tests
- `transport` - Transport module
- `exchange-rates` - Exchange rates module
- `locations` - Locations module
- `addresses` - Addresses module

### Commit Message Rules

1. ✅ **Use present tense**: "add feature" not "added feature"
2. ✅ **Use imperative mood**: "fix bug" not "fixes bug"
3. ✅ **Lowercase type and description**
4. ✅ **No period at the end of description**
5. ✅ **Minimum 3 characters in description**
6. ✅ **Maximum 100 characters total**

### Examples

```bash
# ✅ Good commit messages
git commit -m "feat: add OAuth2 authentication"
git commit -m "fix(api): resolve user registration validation"
git commit -m "docs: update deployment instructions"
git commit -m "test(auth): add integration tests for login flow"
git commit -m "chore: update npm dependencies to latest versions"

# ❌ Bad commit messages
git commit -m "Add OAuth2"                    # Missing type
git commit -m "feat: Add OAuth2."             # Capital letter, period
git commit -m "fixed the login bug"           # Wrong tense, no type
git commit -m "feat: a"                       # Too short
git commit -m "update"                        # No type, too vague
```

## 📬 Pull Requests

### PR Title Requirements

PR titles must follow the same conventional commit format:

```
type(optional-scope): description
```

**Requirements:**

- ✅ Follow conventional commit format
- ✅ Minimum 10 characters
- ✅ Maximum 100 characters
- ✅ Descriptive and clear

### PR Description Requirements

**Requirements:**

- ✅ Minimum 20 characters
- ✅ Describe what changes were made
- ✅ Explain why the changes were necessary
- ✅ Include any breaking changes
- ✅ Reference related issues

### PR Description Template

```markdown
## What Changed

Brief description of the changes made.

## Why

Explanation of why these changes were necessary.

## How to Test

Steps to test the changes.

## Breaking Changes

List any breaking changes (if applicable).

## Related Issues

- Fixes #123
- Relates to #456
```

## 🔄 Validation Workflows

### Workflow Triggers

| Workflow              | Triggers                                | Purpose                                               |
| --------------------- | --------------------------------------- | ----------------------------------------------------- |
| **PR Validation**     | PR opened/edited/synchronized           | Validates PR title, description, branch name, commits |
| **Commit Validation** | Push to any branch (except main/master) | Validates commit messages                             |
| **Branch Validation** | Push to new branch, manual trigger      | Validates branch names                                |

### Validation Results

Each workflow provides:

1. **✅ Success/❌ Failure status**
2. **📝 Detailed validation report**
3. **💡 Suggestions for fixes**
4. **📊 Summary statistics**

### Status Checks

Validation results appear as status checks on:

- Individual commits
- Pull requests
- Branch protection rules (if enabled)

## ⚙️ Configuration

Validation behavior can be customized via `.github/validation-config.yml`:

### Key Configuration Options

```yaml
# Enable/disable entire validation systems
branch_naming:
  enabled: true
  strict_mode: true

commit_validation:
  enabled: true
  min_description_length: 3

pr_validation:
  enabled: true
  require_description: true

# Add custom patterns
branch_naming:
  custom_patterns:
    - "^spike/[a-z0-9-]+$"

# Add custom commit types
commit_validation:
  custom_types:
    - "security"
    - "deps"
```

## 🛠️ Troubleshooting

### Common Issues and Solutions

#### ❌ Branch Name Validation Failed

**Problem**: Your branch name doesn't follow the required pattern.

**Solution**:

```bash
# Rename your current branch
git branch -m feature/your-feature-name

# Or create a new branch with correct name
git checkout -b feature/your-feature-name
```

#### ❌ Commit Message Validation Failed

**Problem**: Your commit message doesn't follow conventional format.

**Solution**:

```bash
# Amend the last commit message
git commit --amend -m "feat: add new feature description"

# For multiple commits, use interactive rebase
git rebase -i HEAD~3  # Edit last 3 commits
```

#### ❌ PR Title Validation Failed

**Problem**: Your PR title doesn't follow conventional format.

**Solution**:

1. Edit the PR title on GitHub
2. Use format: `type: description`
3. Ensure minimum 10 characters

#### ❌ PR Description Too Short

**Problem**: PR description is less than 20 characters.

**Solution**:

1. Edit the PR description on GitHub
2. Add meaningful description of changes
3. Explain the purpose and impact

### Bypassing Validation

For special cases, you can:

1. **Add exempt labels**: `skip-validation`, `automated`
2. **Edit configuration**: Modify `.github/validation-config.yml`
3. **Manual override**: Admin users can override status checks

### Getting Help

If you're stuck:

1. Check the validation report artifacts
2. Look at the workflow logs
3. Review this guide
4. Ask in PR comments for help

## 📚 Examples

### Complete Workflow Example

```bash
# 1. Create a feature branch
git checkout -b feature/user-profile-page

# 2. Make changes and commit with proper message
git add .
git commit -m "feat(frontend): add user profile page with avatar upload"

# 3. Push branch
git push origin feature/user-profile-page

# 4. Create PR with proper title and description
# Title: "feat(frontend): add user profile page with avatar upload"
# Description: "Adds a new user profile page that allows users to view and edit their profile information, including avatar upload functionality..."

# 5. All validations pass ✅
```

### Fixing Validation Issues

```bash
# Fix branch name
git branch -m feature/user-profile

# Fix commit message
git commit --amend -m "feat(frontend): add user profile page"

# Fix multiple commits
git rebase -i HEAD~3
# Change 'pick' to 'reword' for commits you want to fix

# Push force (after amending/rebasing)
git push --force-with-lease origin feature/user-profile
```

## 🎯 Best Practices

1. **Plan your branch name** before creating the branch
2. **Write commit messages** as you work, not all at once
3. **Use descriptive but concise** commit messages
4. **Group related changes** into single commits
5. **Test locally** before pushing
6. **Review validation reports** if something fails
7. **Use scopes** for better organization
8. **Follow the conventional commits** specification

## 🔗 Resources

- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [GitHub Flow Guide](https://guides.github.com/introduction/flow/)
- [Writing Good Commit Messages](https://chris.beams.io/posts/git-commit/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

_This validation system helps maintain code quality and consistency across the project. If you have suggestions for improvements, please open an issue or PR!_
