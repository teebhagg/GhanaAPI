#!/bin/bash
BRANCH_NAME="test-branch"

# Load validation rules from config file or use defaults
if [ -f ".github/branch-naming-rules.json" ]; then
  echo "📄 Loading custom branch naming rules..."
  # For now, we'll use built-in rules, but this allows for future customization
fi

# Define comprehensive branch naming patterns
# Check for double hyphens first (always invalid)
if [[ $BRANCH_NAME =~ -- ]]; then
  echo "❌ Branch name contains double hyphens which are not allowed"
  echo "validation_result=invalid"
  echo "branch_type=invalid"
  echo "matched_pattern="
  echo "status_message=❌ Branch name contains double hyphens"
  exit 0
fi

PATTERN_NAMES=(
  "feature"
  "bugfix"
  "hotfix"
  "fix"
  "chore"
  "docs"
  "refactor"
  "test"
  "ci"
  "perf"
  "style"
  "build"
  "release"
  "version-bump"
  "dependabot"
  "renovate"
  "github-actions"
)

PATTERN_REGEXES=(
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
  "^github-actions/.*$"
)

# Additional allowed patterns for specific cases
SPECIAL_PATTERNS=(
  "^[a-z]+/[A-Z]+-[0-9]+.*$"  # Jira-style: feature/PROJ-123-description
  "^[a-z]+/[0-9]+-.*$"        # Issue-based: feature/123-description
  "^draft/.*$"                # Draft branches
  "^experiment/.*$"           # Experimental branches
  "^poc/.*$"                  # Proof of concept branches
)

VALIDATION_RESULT="invalid"
MATCHED_PATTERN=""
BRANCH_TYPE=""
SUGGESTIONS=()

# Check against main patterns
for i in "${!PATTERN_REGEXES[@]}"; do
  pattern="${PATTERN_REGEXES[$i]}"
  if [[ $BRANCH_NAME =~ $pattern ]]; then
    VALIDATION_RESULT="valid"
    MATCHED_PATTERN=$pattern
    BRANCH_TYPE="${PATTERN_NAMES[$i]}"
    break
  fi
done

# If not matched, check special patterns
if [ "$VALIDATION_RESULT" = "invalid" ]; then
  for pattern in "${SPECIAL_PATTERNS[@]}"; do
    if [[ $BRANCH_NAME =~ $pattern ]]; then
      VALIDATION_RESULT="valid"
      MATCHED_PATTERN=$pattern
      BRANCH_TYPE="special"
      break
    fi
  done
fi

# Generate suggestions if invalid
if [ "$VALIDATION_RESULT" = "invalid" ]; then
  # Try to extract meaningful parts and suggest corrections
  if [[ $BRANCH_NAME =~ ^([a-zA-Z]+)[/_-](.*)$ ]]; then
    prefix_match=$(echo "${BASH_REMATCH[1]}" | tr '[:upper:]' '[:lower:]')
    suffix="${BASH_REMATCH[2]}"
    
    # Normalize suffix
    normalized_suffix=$(echo "$suffix" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g')
    
    case $prefix_match in
      "feat"|"feature")
        SUGGESTIONS+=("feature/$normalized_suffix")
        ;;
      "bug"|"bugfix"|"fix")
        SUGGESTIONS+=("bugfix/$normalized_suffix")
        SUGGESTIONS+=("fix/$normalized_suffix")
        ;;
      "doc"|"docs"|"documentation")
        SUGGESTIONS+=("docs/$normalized_suffix")
        ;;
      "test"|"tests")
        SUGGESTIONS+=("test/$normalized_suffix")
        ;;
      "refact"|"refactor")
        SUGGESTIONS+=("refactor/$normalized_suffix")
        ;;
      *)
        SUGGESTIONS+=("feature/$normalized_suffix")
        SUGGESTIONS+=("chore/$normalized_suffix")
        ;;
    esac
  else
    # Generic suggestions
    clean_name=$(echo "$BRANCH_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g')
    SUGGESTIONS+=("feature/$clean_name")
    SUGGESTIONS+=("bugfix/$clean_name")
    SUGGESTIONS+=("chore/$clean_name")
  fi
fi

# Output results
echo "validation_result=$VALIDATION_RESULT"
echo "branch_type=$BRANCH_TYPE"
echo "matched_pattern=$MATCHED_PATTERN"

if [ "$VALIDATION_RESULT" = "valid" ]; then
  echo "✅ Branch name '$BRANCH_NAME' is valid!"
  echo "✅ Type: $BRANCH_TYPE"
  echo "✅ Matches pattern: $MATCHED_PATTERN"
  echo "status_message=✅ Branch name follows naming convention ($BRANCH_TYPE)"
else
  echo "❌ Branch name '$BRANCH_NAME' is invalid!"
  echo "❌ Does not match any allowed patterns"
  echo ""
  echo "💡 Suggestions:"
  for suggestion in "${SUGGESTIONS[@]}"; do
    echo "  - $suggestion"
  done
  echo "status_message=❌ Branch name does not follow naming convention"
  
  # Save suggestions for later use
  printf '%s\n' "${SUGGESTIONS[@]}" > suggestions.txt
fi