#!/bin/bash
set -euo pipefail

# HTTP Client Test Runner
# Runs all .http test files via ijhttp CLI and generates JSON report
# Usage: run-http-tests.sh --env <dev|production> --report json --output <file.json>

ENV=""
REPORT_FORMAT="json"
OUTPUT_FILE=""
TESTS_DIR="."
PASSED=0
FAILED=0
FAILURES=()

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --env)
      ENV="$2"
      shift 2
      ;;
    --report)
      REPORT_FORMAT="$2"
      shift 2
      ;;
    --output)
      OUTPUT_FILE="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Validate required arguments
if [ -z "$ENV" ]; then
  echo "Error: --env is required (dev or production)"
  exit 1
fi

if [ -z "$OUTPUT_FILE" ]; then
  echo "Error: --output is required"
  exit 1
fi

# Find all .http files in tests directory
TESTS=$(find "$TESTS_DIR" -maxdepth 1 -name "*.http" -type f | sort)

if [ -z "$TESTS" ]; then
  echo "Error: No .http files found in $TESTS_DIR"
  exit 1
fi

echo "Running HTTP tests with environment: $ENV"
echo "Output: $OUTPUT_FILE"
echo "---"

# Run each test file
for TEST_FILE in $TESTS; do
  TEST_NAME=$(basename "$TEST_FILE" .http)

  echo "Running: $TEST_NAME"

  # Execute ijhttp with environment and capture output
  if ijhttp "$TEST_FILE" --env "$ENV" > /dev/null 2>&1; then
    echo "  ✓ PASSED"
    ((PASSED++))
  else
    echo "  ✗ FAILED"
    ((FAILED++))
    FAILURES+=("$TEST_NAME")
  fi
done

echo "---"
echo "Results: $PASSED passed, $FAILED failed"

# Generate JSON report
TOTAL=$((PASSED + FAILED))
JSON_REPORT="{\"passed\": $PASSED, \"failed\": $FAILED, \"total\": $TOTAL, \"failures\": ["

if [ ${#FAILURES[@]} -gt 0 ]; then
  for i in "${!FAILURES[@]}"; do
    JSON_REPORT+="{\"file\": \"${FAILURES[$i]}.http\", \"message\": \"Test failed\"}"
    if [ $((i + 1)) -lt ${#FAILURES[@]} ]; then
      JSON_REPORT+=", "
    fi
  done
fi

JSON_REPORT+="]}"

# Write report to output file
echo "$JSON_REPORT" > "$OUTPUT_FILE"

echo "Report saved to: $OUTPUT_FILE"

# Exit with appropriate code
if [ $FAILED -gt 0 ]; then
  exit 1
else
  exit 0
fi
