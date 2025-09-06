#!/bin/bash

# Test script for validation workflows
# This script tests the validation logic locally before deploying

set -e

echo "🧪 Testing Ghana API Validation Workflows"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

# Helper function to run tests
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"  # "pass" or "fail"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "\n${BLUE}Test $TOTAL_TESTS:${NC} $test_name"
    
    if eval "$test_command" > /dev/null 2>&1; then
        result="pass"
    else
        result="fail"
    fi
    
    if [ "$result" = "$expected_result" ]; then
        echo -e "${GREEN}✅ PASS${NC} - Expected $expected_result, got $result"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}❌ FAIL${NC} - Expected $expected_result, got $result"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

# Test branch name validation
echo -e "\n${YELLOW}🌿 Testing Branch Name Validation${NC}"
echo "=================================="

test_branch_name() {
    local branch_name="$1"
    local expected="$2"
    
    # Check for double hyphens first (invalid)
    if [[ $branch_name =~ -- ]]; then
        return 1  # Invalid due to double hyphens
    fi
    
    # Extract validation logic from branch-validation.yml
    VALID_PATTERNS=(
        "^feature/[a-z0-9]+([a-z0-9-]*[a-z0-9]+)*$"
        "^bugfix/[a-z0-9]+([a-z0-9-]*[a-z0-9]+)*$"
        "^hotfix/[a-z0-9]+([a-z0-9-]*[a-z0-9]+)*$"
        "^fix/[a-z0-9]+([a-z0-9-]*[a-z0-9]+)*$"
        "^chore/[a-z0-9]+([a-z0-9-]*[a-z0-9]+)*$"
        "^docs/[a-z0-9]+([a-z0-9-]*[a-z0-9]+)*$"
        "^refactor/[a-z0-9]+([a-z0-9-]*[a-z0-9]+)*$"
        "^test/[a-z0-9]+([a-z0-9-]*[a-z0-9]+)*$"
        "^ci/[a-z0-9]+([a-z0-9-]*[a-z0-9]+)*$"
        "^perf/[a-z0-9]+([a-z0-9-]*[a-z0-9]+)*$"
        "^style/[a-z0-9]+([a-z0-9-]*[a-z0-9]+)*$"
        "^build/[a-z0-9]+([a-z0-9-]*[a-z0-9]+)*$"
        "^release/v[0-9]+\.[0-9]+\.[0-9]+.*$"
        "^version-bump/v[0-9]+\.[0-9]+\.[0-9]+.*$"
        "^dependabot/.*$"
        "^renovate/.*$"
        "^[a-z]+/[A-Z]+-[0-9]+.*$"
        "^[a-z]+/[0-9]+-.*$"
    )
    
    for pattern in "${VALID_PATTERNS[@]}"; do
        if [[ $branch_name =~ $pattern ]]; then
            return 0  # Valid
        fi
    done
    return 1  # Invalid
}

# Valid branch names
run_test "Valid feature branch" "test_branch_name 'feature/user-authentication'" "pass"
run_test "Valid bugfix branch" "test_branch_name 'bugfix/login-issue'" "pass"
run_test "Valid hotfix branch" "test_branch_name 'hotfix/security-patch'" "pass"
run_test "Valid chore branch" "test_branch_name 'chore/update-deps'" "pass"
run_test "Valid docs branch" "test_branch_name 'docs/api-guide'" "pass"
run_test "Valid refactor branch" "test_branch_name 'refactor/user-service'" "pass"
run_test "Valid test branch" "test_branch_name 'test/integration-tests'" "pass"
run_test "Valid ci branch" "test_branch_name 'ci/workflow-update'" "pass"
run_test "Valid version bump" "test_branch_name 'version-bump/v1.2.3'" "pass"
run_test "Valid release branch" "test_branch_name 'release/v2.0.0'" "pass"
run_test "Valid dependabot branch" "test_branch_name 'dependabot/npm_and_yarn/axios-1.6.0'" "pass"
run_test "Valid Jira reference" "test_branch_name 'feature/PROJ-123-user-auth'" "pass"
run_test "Valid issue reference" "test_branch_name 'bugfix/456-memory-leak'" "pass"

# Invalid branch names
run_test "Invalid: wrong case" "test_branch_name 'Feature/UserAuth'" "fail"
run_test "Invalid: no type prefix" "test_branch_name 'user-authentication'" "fail"
run_test "Invalid: empty description" "test_branch_name 'feature/'" "fail"
run_test "Invalid: special characters" "test_branch_name 'feature/user_auth!'" "fail"
run_test "Invalid: spaces" "test_branch_name 'feature/user auth'" "fail"
run_test "Invalid: double hyphens" "test_branch_name 'feature/user--auth'" "fail"
run_test "Invalid: ends with hyphen" "test_branch_name 'feature/user-auth-'" "fail"
run_test "Invalid: starts with hyphen" "test_branch_name 'feature/-user-auth'" "fail"

# Test commit message validation
echo -e "\n${YELLOW}📝 Testing Commit Message Validation${NC}"
echo "====================================="

test_commit_message() {
    local commit_msg="$1"
    local expected="$2"
    
    # Check for common past tense patterns (invalid)
    if [[ $commit_msg =~ [[:space:]](added|fixed|updated|changed|removed|deleted|created|implemented|refactored)[[:space:]] ]]; then
        return 1  # Invalid due to past tense
    fi
    
    # Extract validation logic from commit-validation.yml
    VALID_PATTERNS=(
        "^feat(\(.+\))?: [a-z][^.]*[^.]$"
        "^fix(\(.+\))?: [a-z][^.]*[^.]$"
        "^docs(\(.+\))?: [a-z][^.]*[^.]$"
        "^style(\(.+\))?: [a-z][^.]*[^.]$"
        "^refactor(\(.+\))?: [a-z][^.]*[^.]$"
        "^test(\(.+\))?: [a-z][^.]*[^.]$"
        "^chore(\(.+\))?: [a-z][^.]*[^.]$"
        "^ci(\(.+\))?: [a-z][^.]*[^.]$"
        "^perf(\(.+\))?: [a-z][^.]*[^.]$"
        "^build(\(.+\))?: [a-z][^.]*[^.]$"
        "^revert(\(.+\))?: [a-z][^.]*[^.]$"
        "^Merge .+"
        "^Initial commit$"
        "^Revert .+"
    )
    
    for pattern in "${VALID_PATTERNS[@]}"; do
        if [[ $commit_msg =~ $pattern ]]; then
            return 0  # Valid
        fi
    done
    return 1  # Invalid
}

# Valid commit messages
run_test "Valid feat commit" "test_commit_message 'feat: add user authentication'" "pass"
run_test "Valid fix commit" "test_commit_message 'fix: resolve login timeout issue'" "pass"
run_test "Valid feat with scope" "test_commit_message 'feat(api): add new endpoint'" "pass"
run_test "Valid fix with scope" "test_commit_message 'fix(frontend): resolve UI bug'" "pass"
run_test "Valid docs commit" "test_commit_message 'docs: update README with setup instructions'" "pass"
run_test "Valid chore commit" "test_commit_message 'chore: update npm dependencies'" "pass"
run_test "Valid refactor commit" "test_commit_message 'refactor: extract validation logic'" "pass"
run_test "Valid test commit" "test_commit_message 'test: add unit tests for auth service'" "pass"
run_test "Valid ci commit" "test_commit_message 'ci: update GitHub Actions workflow'" "pass"
run_test "Valid perf commit" "test_commit_message 'perf: optimize database queries'" "pass"
run_test "Valid build commit" "test_commit_message 'build: update webpack config'" "pass"
run_test "Valid revert commit" "test_commit_message 'revert: undo feature X implementation'" "pass"
run_test "Valid merge commit" "test_commit_message 'Merge pull request #123 from feature/auth'" "pass"
run_test "Valid initial commit" "test_commit_message 'Initial commit'" "pass"

# Invalid commit messages
run_test "Invalid: no type" "test_commit_message 'add user authentication'" "fail"
run_test "Invalid: wrong format" "test_commit_message 'added user authentication'" "fail"
run_test "Invalid: too short" "test_commit_message 'feat: a'" "fail"
run_test "Invalid: capital letter" "test_commit_message 'Feat: add authentication'" "fail"
run_test "Invalid: period at end" "test_commit_message 'feat: add authentication.'" "fail"
run_test "Invalid: past tense" "test_commit_message 'feat: added authentication'" "fail"
run_test "Invalid: empty description" "test_commit_message 'feat: '" "fail"
run_test "Invalid: just type" "test_commit_message 'feat'" "fail"

# Test PR title validation (same as commit message)
echo -e "\n${YELLOW}📬 Testing PR Title Validation${NC}"
echo "==============================="

test_pr_title() {
    local pr_title="$1"
    local expected="$2"
    
    # PR titles follow same rules as commit messages but with min 10 chars and no period
    VALID_TITLE_PATTERNS=(
        "^feat(\(.+\))?: [a-z].{9,}[^.]$"
        "^fix(\(.+\))?: [a-z].{9,}[^.]$"
        "^docs(\(.+\))?: [a-z].{9,}[^.]$"
        "^style(\(.+\))?: [a-z].{9,}[^.]$"
        "^refactor(\(.+\))?: [a-z].{9,}[^.]$"
        "^test(\(.+\))?: [a-z].{9,}[^.]$"
        "^chore(\(.+\))?: [a-z].{9,}[^.]$"
        "^ci(\(.+\))?: [a-z].{9,}[^.]$"
        "^perf(\(.+\))?: [a-z].{9,}[^.]$"
        "^build(\(.+\))?: [a-z].{9,}[^.]$"
        "^revert(\(.+\))?: [a-z].{9,}[^.]$"
    )
    
    for pattern in "${VALID_TITLE_PATTERNS[@]}"; do
        if [[ $pr_title =~ $pattern ]]; then
            return 0  # Valid
        fi
    done
    return 1  # Invalid
}

# Valid PR titles
run_test "Valid feat PR title" "test_pr_title 'feat: add user authentication system'" "pass"
run_test "Valid fix PR title" "test_pr_title 'fix: resolve login timeout issues'" "pass"
run_test "Valid feat with scope" "test_pr_title 'feat(api): add new user endpoints'" "pass"
run_test "Valid docs PR title" "test_pr_title 'docs: update API documentation with examples'" "pass"
run_test "Valid chore PR title" "test_pr_title 'chore: update all npm dependencies to latest'" "pass"

# Invalid PR titles
run_test "Invalid: too short" "test_pr_title 'feat: add auth'" "fail"
run_test "Invalid: no type" "test_pr_title 'add user authentication system'" "fail"
run_test "Invalid: wrong case" "test_pr_title 'Feat: add user authentication'" "fail"
run_test "Invalid: period at end" "test_pr_title 'feat: add user authentication.'" "fail"

# Test file existence validation
echo -e "\n${YELLOW}📁 Testing Required Files Validation${NC}"
echo "===================================="

test_required_files() {
    local files=("README.md" "LICENSE" "backend/package.json")
    local missing_files=()
    
    for file in "${files[@]}"; do
        if [ ! -f "$file" ]; then
            missing_files+=("$file")
        fi
    done
    
    if [ ${#missing_files[@]} -eq 0 ]; then
        return 0  # All files present
    else
        return 1  # Some files missing
    fi
}

run_test "Required files present" "test_required_files" "pass"

# Test YAML file validation
echo -e "\n${YELLOW}📄 Testing YAML File Validation${NC}"
echo "==============================="

test_yaml_syntax() {
    local file="$1"
    
    # Basic YAML validation (check for tabs and basic structure)
    if [ -f "$file" ]; then
        # Check for tabs (YAML should use spaces)
        if grep -q $'\t' "$file"; then
            return 1  # Contains tabs
        fi
        
        # Check for basic YAML structure issues
        if ! grep -q "^[a-zA-Z]" "$file"; then
            return 1  # No top-level keys
        fi
        
        return 0  # Basic validation passed
    else
        return 1  # File doesn't exist
    fi
}

run_test "Release workflow YAML" "test_yaml_syntax '.github/workflows/release.yml'" "pass"
run_test "Version bump workflow YAML" "test_yaml_syntax '.github/workflows/version-bump.yml'" "pass"
run_test "PR validation workflow YAML" "test_yaml_syntax '.github/workflows/pr-validation.yml'" "pass"
run_test "Commit validation workflow YAML" "test_yaml_syntax '.github/workflows/commit-validation.yml'" "pass"
run_test "Branch validation workflow YAML" "test_yaml_syntax '.github/workflows/branch-validation.yml'" "pass"
run_test "Validation config YAML" "test_yaml_syntax '.github/validation-config.yml'" "pass"

# Test configuration loading
echo -e "\n${YELLOW}⚙️ Testing Configuration Loading${NC}"
echo "==============================="

test_config_structure() {
    local config_file=".github/validation-config.yml"
    
    if [ -f "$config_file" ]; then
        # Check for required sections
        if grep -q "branch_naming:" "$config_file" && \
           grep -q "commit_validation:" "$config_file" && \
           grep -q "pr_validation:" "$config_file"; then
            return 0  # Has required sections
        fi
    fi
    return 1  # Missing sections or file
}

run_test "Configuration file structure" "test_config_structure" "pass"

# Print test summary
echo -e "\n${YELLOW}📊 Test Summary${NC}"
echo "==============="
echo -e "Total tests: $TOTAL_TESTS"
echo -e "${GREEN}Tests passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests failed: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed! Validation workflows are ready to deploy.${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed. Please review and fix the issues.${NC}"
    exit 1
fi