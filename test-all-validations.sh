#!/bin/bash

echo "🧪 COMPREHENSIVE VALIDATION TEST"
echo "================================"
echo ""

# Current details
CURRENT_BRANCH="feature/implement-version-numbering-and-pr-validations"
LATEST_COMMIT="feat: enhance branch validation workflow with detailed PR comments and remove artifact upload"
PR_TITLE="feat: implement branch and PR validation workflows with automated feedback"
PR_DESCRIPTION="This pull request introduces two new GitHub Actions workflows to enforce and automate branch, pull request, and commit message standards. The first workflow (\`branch-validation.yml\`) validates branch names on creation and pushes, while the second (\`pr-validation.yml\`) validates PRs for branch name, title, description, commit messages, and required files. These workflows help maintain consistency and quality in the repository by providing automated feedback and suggestions."

echo "📋 Testing Against:"
echo "Branch: $CURRENT_BRANCH"
echo "Commit: $LATEST_COMMIT"
echo "PR Title: $PR_TITLE"
echo "PR Description: ${PR_DESCRIPTION:0:80}..."
echo ""

# 1. BRANCH NAME VALIDATION
echo "🌿 BRANCH NAME VALIDATION"
echo "========================"

# Test branch patterns from branch-validation.yml
declare -A BRANCH_PATTERNS=(
    ["feature"]="^feature/[a-z0-9]+([a-z0-9-]*[a-z0-9]+)*$"
    ["bugfix"]="^bugfix/[a-z0-9]+([a-z0-9-]*[a-z0-9]+)*$"
)

BRANCH_VALID=false
for type in "${!BRANCH_PATTERNS[@]}"; do
    pattern="${BRANCH_PATTERNS[$type]}"
    if [[ $CURRENT_BRANCH =~ $pattern ]]; then
        BRANCH_VALID=true
        echo "✅ PASS: Branch matches $type pattern: $pattern"
        break
    fi
done

if [ "$BRANCH_VALID" != true ]; then
    echo "❌ FAIL: Branch does not match any allowed patterns"
fi

echo ""

# 2. COMMIT MESSAGE VALIDATION  
echo "💬 COMMIT MESSAGE VALIDATION"
echo "============================"

# Test commit patterns from commit-validation.yml
COMMIT_PATTERNS=(
    "^feat(\(.+\))?: [a-z][^.]*[^.]$"
    "^fix(\(.+\))?: [a-z][^.]*[^.]$"
    "^docs(\(.+\))?: [a-z][^.]*[^.]$"
    "^refactor(\(.+\))?: [a-z][^.]*[^.]$"
)

COMMIT_VALID=false
for pattern in "${COMMIT_PATTERNS[@]}"; do
    if [[ $LATEST_COMMIT =~ $pattern ]]; then
        COMMIT_VALID=true
        echo "✅ PASS: Commit matches pattern: $pattern"
        break
    fi
done

if [ "$COMMIT_VALID" != true ]; then
    echo "❌ FAIL: Commit does not match conventional commits format"
fi

echo ""

# 3. PR TITLE VALIDATION
echo "📝 PR TITLE VALIDATION"
echo "======================"

# Test PR title patterns from pr-validation.yml
PR_TITLE_PATTERNS=(
    "^feat(\(.+\))?: [a-z].{2,}[^.]$"
    "^fix(\(.+\))?: [a-z].{2,}[^.]$"
    "^docs(\(.+\))?: [a-z].{2,}[^.]$"
    "^chore(\(.+\))?: [a-z].{2,}[^.]$"
)

PR_TITLE_VALID=false
for pattern in "${PR_TITLE_PATTERNS[@]}"; do
    if [[ $PR_TITLE =~ $pattern ]]; then
        PR_TITLE_VALID=true
        echo "✅ PASS: PR title matches pattern: $pattern"
        break
    fi
done

if [ "$PR_TITLE_VALID" != true ]; then
    echo "❌ FAIL: PR title does not match conventional commits format"
fi

echo ""

# 4. PR DESCRIPTION VALIDATION
echo "📄 PR DESCRIPTION VALIDATION"
echo "============================"

if [ -z "$PR_DESCRIPTION" ] || [ ${#PR_DESCRIPTION} -lt 20 ]; then
    echo "❌ FAIL: PR description is too short or missing (must be at least 20 characters)"
else
    echo "✅ PASS: PR description is adequate (${#PR_DESCRIPTION} characters)"
fi

echo ""

# 5. OVERALL SUMMARY
echo "🎯 OVERALL VALIDATION SUMMARY"
echo "============================="

ALL_VALID=true
if [ "$BRANCH_VALID" != true ]; then ALL_VALID=false; fi
if [ "$COMMIT_VALID" != true ]; then ALL_VALID=false; fi  
if [ "$PR_TITLE_VALID" != true ]; then ALL_VALID=false; fi
if [ ${#PR_DESCRIPTION} -lt 20 ]; then ALL_VALID=false; fi

if [ "$ALL_VALID" = true ]; then
    echo "🎉 ALL VALIDATIONS PASSED!"
    echo "Your branch is ready for PR creation and merging!"
else
    echo "⚠️  Some validations failed. Please review the results above."
fi

echo ""
echo "✅ Branch Name: $([ "$BRANCH_VALID" = true ] && echo "PASS" || echo "FAIL")"
echo "✅ Commit Message: $([ "$COMMIT_VALID" = true ] && echo "PASS" || echo "FAIL")"  
echo "✅ PR Title: $([ "$PR_TITLE_VALID" = true ] && echo "PASS" || echo "FAIL")"
echo "✅ PR Description: $([ ${#PR_DESCRIPTION} -ge 20 ] && echo "PASS" || echo "FAIL")"
