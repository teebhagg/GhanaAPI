# Validation Workflows

GhanaAPI implements automated validation workflows to ensure code quality, consistency, and proper contribution standards. These workflows run automatically on every pull request and help maintain high standards across the project.

## 🔍 Overview

Our validation system consists of three main workflows that work together to ensure quality contributions:

1. **Branch Name Validation** - Ensures proper branch naming conventions
2. **Pull Request Validation** - Validates PR titles, descriptions, and content
3. **Commit Message Validation** - Enforces conventional commit message format

All validations follow industry best practices and help maintain a clean, professional codebase.

## 🌿 Branch Name Validation

### Purpose

Enforces consistent branch naming conventions that make it easy to understand the purpose and scope of changes.

### Validation Rules

#### Valid Branch Patterns

| Pattern                | Example                           | Use Case                      |
| ---------------------- | --------------------------------- | ----------------------------- |
| `feature/description`  | `feature/address-bulk-validation` | New features and enhancements |
| `bugfix/description`   | `bugfix/exchange-rate-caching`    | Bug fixes and corrections     |
| `hotfix/description`   | `hotfix/security-patch`           | Critical fixes for production |
| `chore/description`    | `chore/update-dependencies`       | Maintenance tasks             |
| `docs/description`     | `docs/api-examples`               | Documentation updates         |
| `refactor/description` | `refactor/service-structure`      | Code improvements             |
| `test/description`     | `test/unit-coverage`              | Testing additions             |
| `ci/description`       | `ci/workflow-optimization`        | CI/CD improvements            |

#### Special Cases

- **Version Bumps**: `version-bump/v1.2.3`
- **Automated PRs**: `dependabot/*`, `renovate/*`
- **Issue-based**: `feature/123-add-new-endpoint`
- **Jira Integration**: `feature/PROJ-123-description`

### Examples

✅ **Valid Branch Names**

```bash
feature/digital-address-validation
bugfix/exchange-rate-api-timeout
docs/contributing-guidelines
chore/eslint-configuration
hotfix/memory-leak-fix
```

❌ **Invalid Branch Names**

```bash
my-new-feature              # Missing type prefix
Feature/MyNewFeature        # Wrong case
feature/My_New_Feature      # Underscores not allowed
fix-bug                     # Missing slash separator
feature/                    # Empty description
```

### When Validation Runs

- **Push Events**: Validates branch name on every push
- **Pull Request Events**: Validates source branch name
- **Branch Creation**: Validates when new branches are created

### Validation Feedback

The workflow provides automatic feedback:

- ✅ **Success**: Displays validation success with branch type
- ❌ **Failure**: Shows specific error and suggests valid alternatives
- 💡 **Suggestions**: Automatically generates corrected branch names

## 📝 Pull Request Validation

### Purpose

Ensures pull requests contain adequate information and follow project standards before review.

### Validation Checks

#### 1. PR Title Validation

**Format**: Conventional Commits format

- Must start with type: `feat:`, `fix:`, `docs:`, `chore:`, etc.
- Must have lowercase description
- Must not end with a period
- Must be at least 10 characters long

✅ **Valid PR Titles**

```
feat: add bulk address validation endpoint
fix: resolve exchange rate caching issue
docs: update API documentation examples
chore: upgrade dependencies to latest versions
```

❌ **Invalid PR Titles**

```
Add new feature                    # Missing type prefix
feat: Add New Feature              # Wrong case
fix: resolve caching issue.        # Period at end
feat: add                          # Too short
```

#### 2. PR Description Validation

**Requirements**:

- Minimum 20 characters
- Should provide clear explanation of changes
- Should reference related issues when applicable

#### 3. Branch Name Validation

**Requirement**: Source branch must follow naming conventions (same as branch validation)

#### 4. Commit Message Validation

**Requirement**: All commits in the PR must follow conventional format

#### 5. Required Files Check

**Requirements**: Essential project files must be present:

- `README.md`
- `LICENSE`
- `backend/package.json`

### Validation Feedback

The workflow provides comprehensive feedback through PR comments:

#### Success Comment

```markdown
## ✅ PR Validation Passed

All validation checks have passed successfully!

### Validation Results:

- ✅ Branch name follows naming convention
- ✅ PR title follows conventional commits format
- ✅ PR description is provided
- ✅ All commit messages follow conventional commits format
- ✅ All required files are present

Your PR is ready for review! 🚀
```

#### Failure Comment

```markdown
## ❌ PR Validation Failed

Some validation checks have failed. Please fix the issues below:

### Validation Results:

- ❌ Branch name does not follow naming convention
- ✅ PR title follows conventional commits format
- ❌ PR description must be at least 20 characters
- ❌ Some commit messages don't follow conventional commits format
- ✅ All required files are present

### Guidelines:

[Detailed guidelines and examples]
```

## 💬 Commit Message Validation

### Purpose

Enforces conventional commit message format for clear, consistent commit history and automated changelog generation.

### Conventional Commits Format

**Structure**: `type(scope): description`

#### Required Format

- **Type**: One of `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `perf`, `build`, `revert`
- **Scope** (optional): Area of change in parentheses
- **Description**: Clear, lowercase description without trailing period

#### Valid Types

| Type       | Description              | Example                                 |
| ---------- | ------------------------ | --------------------------------------- |
| `feat`     | New features             | `feat: add address validation endpoint` |
| `fix`      | Bug fixes                | `fix: resolve rate limiting issue`      |
| `docs`     | Documentation changes    | `docs: update API examples`             |
| `style`    | Code style changes       | `style: fix linting issues`             |
| `refactor` | Code refactoring         | `refactor: optimize query performance`  |
| `test`     | Test additions           | `test: add unit tests for validators`   |
| `chore`    | Maintenance tasks        | `chore: update dependencies`            |
| `ci`       | CI/CD changes            | `ci: add deployment workflow`           |
| `perf`     | Performance improvements | `perf: optimize database queries`       |
| `build`    | Build system changes     | `build: update webpack config`          |
| `revert`   | Revert previous commits  | `revert: undo breaking changes`         |

### Examples

✅ **Valid Commit Messages**

```bash
feat: add bulk address validation
fix: resolve exchange rate timeout
docs: update contributing guidelines
feat(api): add rate limiting middleware
fix(addresses): handle malformed coordinates
test: add integration tests for locations
```

❌ **Invalid Commit Messages**

```bash
Add new feature                    # Missing type
feat: Add new feature              # Wrong case
fix: resolve issue.                # Period at end
Updated documentation              # Missing type
feat:add feature                   # Missing space after colon
```

### Special Cases

- **Merge Commits**: Automatically allowed (`Merge branch 'feature/...'`)
- **Initial Commit**: Allowed (`Initial commit`)
- **Revert Commits**: Allowed (`Revert "previous commit"`)
- **Automated Commits**: Dependabot and renovate commits are automatically approved

### Validation Timing

- **Push Events**: Validates all commits in the push
- **Manual Trigger**: Can be run manually via workflow dispatch
- **Scope**: Excludes pushes to `main` branch

### Validation Feedback

#### Success

```
✅ All commit messages follow conventional format!
📊 Validation Summary:
- Total commits checked: 3
- Valid commits: 3
- Invalid commits: 0
```

#### Failure

```
❌ Found 2 invalid commit message(s):

Invalid commits:
  ❌ abc1234: Add new feature
  ❌ def5678: Fix bug

Valid commits:
  ✅ ghi9012: feat: add validation workflow
```

## 🛠️ Fixing Validation Issues

### Branch Name Issues

**Problem**: Invalid branch name
**Solution**: Rename your branch

```bash
# Rename current branch
git branch -m feature/new-descriptive-name

# Push renamed branch
git push origin -u feature/new-descriptive-name

# Delete old branch
git push origin --delete old-branch-name
```

### PR Title Issues

**Problem**: Invalid PR title
**Solution**: Edit PR title in GitHub UI or use CLI

```bash
# Using GitHub CLI
gh pr edit --title "feat: add new validation workflow"
```

### Commit Message Issues

**Problem**: Invalid commit messages
**Solutions**:

#### Option 1: Amend Last Commit

```bash
git commit --amend -m "feat: add new validation feature"
git push --force-with-lease
```

#### Option 2: Interactive Rebase

```bash
# Rewrite last 3 commits
git rebase -i HEAD~3

# In the editor, change 'pick' to 'reword' for commits to fix
# Save and close, then update each commit message
```

#### Option 3: Reset and Recommit

```bash
# Soft reset to staging area
git reset --soft HEAD~3

# Recommit with proper messages
git commit -m "feat: add validation workflows"
git push --force-with-lease
```

### PR Description Issues

**Problem**: Description too short
**Solution**: Edit PR description in GitHub UI

- Add detailed explanation of changes
- Include context and reasoning
- Reference related issues
- Provide examples if applicable

## 🎯 Best Practices

### Branch Naming

- Use descriptive, concise names
- Start with the appropriate type prefix
- Use hyphens to separate words
- Keep it under 50 characters when possible

### PR Titles

- Write in imperative mood ("add" not "adds" or "added")
- Be specific about what was changed
- Include scope when it clarifies the change
- Follow conventional commits format exactly

### Commit Messages

- Make each commit atomic (one logical change)
- Write clear, descriptive messages
- Use conventional format consistently
- Avoid generic messages like "fix bug" or "update code"

### PR Descriptions

- Explain the "why" not just the "what"
- Include screenshots for UI changes
- Reference related issues and PRs
- Provide testing instructions

## 🚨 Troubleshooting

### Common Issues

#### Validation Not Running

- Check that the workflow files are in `.github/workflows/`
- Ensure proper permissions are set
- Verify event triggers match your action

#### False Positives

- Review the specific pattern that failed
- Check for hidden characters or formatting issues
- Ensure consistent case sensitivity

#### Multiple Validation Failures

- Fix issues one at a time
- Start with branch names, then commits, then PR details
- Use the provided suggestions when available

### Getting Help

If you encounter issues with validation workflows:

1. **Check the workflow logs** in GitHub Actions
2. **Review this documentation** for proper formats
3. **Ask in GitHub Discussions** for specific questions
4. **Open an issue** if you believe there's a bug in validation

## 📚 Additional Resources

- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [Git Branch Naming Conventions](https://gist.github.com/digitaljhelms/4287848)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GhanaAPI Contributing Guide](./overview.md)

---

:::tip Pro Tip
Set up commit message templates in your local Git config to make following the conventional format easier:

```bash
git config commit.template ~/.gitmessage
```

Create `~/.gitmessage` with:

```
# type(scope): description

# Examples:
# feat: add new API endpoint
# fix: resolve authentication issue
# docs: update installation guide
```

:::

:::warning Important
All validation workflows must pass before a PR can be merged. This ensures consistency and quality across the entire codebase.
:::

:::info Need Help?
If you're struggling with validation requirements, don't hesitate to ask for help in [GitHub Discussions](https://github.com/teebhagg/GhanaAPI/discussions). The community is here to support you!
:::
