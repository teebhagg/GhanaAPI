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

# Test against both patterns used in the workflows
if [[ $CURRENT_BRANCH =~ ^feature/[a-z0-9-]+$ ]]; then
    echo "✅ PASS: Branch matches PR validation pattern: ^feature/[a-z0-9-]+$"
    BRANCH_VALID_PR=true
else
    echo "❌ FAIL: Branch doesn't match PR validation pattern"
    BRANCH_VALID_PR=false
fi

if [[ $CURRENT_BRANCH =~ ^feature/[a-z0-9]+([a-z0-9-]*[a-z0-9]+)*$ ]]; then
    echo "✅ PASS: Branch matches branch validation pattern: ^feature/[a-z0-9]+([a-z0-9-]*[a-z0-9]+)*$"
    BRANCH_VALID_BRANCH=true
else
    echo "❌ FAIL: Branch doesn't match branch validation pattern"
    BRANCH_VALID_BRANCH=false
fi

echo ""

# 2. COMMIT MESSAGE VALIDATION  
echo "💬 COMMIT MESSAGE VALIDATION"
echo "============================"

COMMIT_PATTERN="^feat(\(.+\))?: [a-z][^.]*[^.]$"
if [[ $LATEST_COMMIT =~ $COMMIT_PATTERN ]]; then
    echo "✅ PASS: Commit matches feat pattern: $COMMIT_PATTERN"
    COMMIT_VALID=true
else
    echo "❌ FAIL: Commit doesn't match conventional commits format"
    COMMIT_VALID=false
fi

echo ""

# 3. PR TITLE VALIDATION
echo "📝 PR TITLE VALIDATION"
echo "======================"

PR_TITLE_PATTERN="^feat(\(.+\))?: [a-z].{2,}[^.]$"
if [[ $PR_TITLE =~ $PR_TITLE_PATTERN ]]; then
    echo "✅ PASS: PR title matches feat pattern: $PR_TITLE_PATTERN"
    PR_TITLE_VALID=true
else
    echo "❌ FAIL: PR title doesn't match conventional commits format"
    PR_TITLE_VALID=false
fi

echo ""

# 4. PR DESCRIPTION VALIDATION
echo "📄 PR DESCRIPTION VALIDATION"
echo "============================"

if [ ${#PR_DESCRIPTION} -ge 20 ]; then
    echo "✅ PASS: PR description is adequate (${#PR_DESCRIPTION} characters, minimum 20)"
    PR_DESC_VALID=true
else
    echo "❌ FAIL: PR description is too short (${#PR_DESCRIPTION} characters, minimum 20)"
    PR_DESC_VALID=false
fi

echo ""

# 5. OVERALL SUMMARY
echo "🎯 OVERALL VALIDATION SUMMARY"
echo "============================="

ALL_VALID=true
if [ "$BRANCH_VALID_PR" != true ] || [ "$BRANCH_VALID_BRANCH" != true ]; then ALL_VALID=false; fi
if [ "$COMMIT_VALID" != true ]; then ALL_VALID=false; fi  
if [ "$PR_TITLE_VALID" != true ]; then ALL_VALID=false; fi
if [ "$PR_DESC_VALID" != true ]; then ALL_VALID=false; fi

if [ "$ALL_VALID" = true ]; then
    echo "🎉 ALL VALIDATIONS PASSED!"
    echo "Your branch is ready for PR creation and merging!"
else
    echo "⚠️  Some validations failed. Please review the results above."
fi

echo ""
echo "Results Summary:"
echo "=================="
echo "✅ Branch Name (PR workflow): $([ "$BRANCH_VALID_PR" = true ] && echo "PASS" || echo "FAIL")"
echo "✅ Branch Name (Branch workflow): $([ "$BRANCH_VALID_BRANCH" = true ] && echo "PASS" || echo "FAIL")"
echo "✅ Commit Message: $([ "$COMMIT_VALID" = true ] && echo "PASS" || echo "FAIL")"  
echo "✅ PR Title: $([ "$PR_TITLE_VALID" = true ] && echo "PASS" || echo "FAIL")"
echo "✅ PR Description: $([ "$PR_DESC_VALID" = true ] && echo "PASS" || echo "FAIL")"
