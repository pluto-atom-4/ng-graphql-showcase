#!/bin/bash

# Initialize base JSON arrays
prs_json="[]"
all_files="[]"

for pr in {77..80}; do
  # Fetch PR data
  pr_data=$(gh pr view "$pr" --json title,body,files 2>/dev/null)

  if [ -n "$pr_data" ]; then
    # Parse PR info directly into an object
    pr_obj=$(echo "$pr_data" | jq --arg num "$pr" '{pr_number: ($num | tonumber), title: .title, body: .body}')
    prs_json=$(echo "$prs_json" | jq --argjson obj "$pr_obj" '. += [$obj]')

    # Extract files safely as a valid JSON array
    pr_files=$(echo "$pr_data" | jq '[.files[].path]')
    all_files=$(echo "$all_files" | jq --argjson new_files "$pr_files" '. += $new_files')
  fi
done

# Deduplicate all files
unique_files=$(echo "$all_files" | jq 'unique')

# Output final payload
jq -n \
  --argjson prs "$prs_json" \
  --argjson files "$unique_files" \
  '{pullrequests: $prs, file_paths: $files}'

