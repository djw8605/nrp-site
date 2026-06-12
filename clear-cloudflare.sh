#!/usr/bin/env bash
set -euo pipefail

apt-get update && apt-get install -y jq curl

ACCOUNT_ID="$CLOUDFLARE_ACCOUNT_ID"
PROJECT_NAME="$CLOUDFLARE_PROJECT_NAME"
API_TOKEN="$CLOUDFLARE_API_TOKEN"
API_URL="https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/$PROJECT_NAME/deployments"

# 30 days is enough
cutoff=$(date -u -d '30 days ago' +"%Y-%m-%dT%H:%M:%SZ")

per_page=25
response=$(curl -s -H "Authorization: Bearer $API_TOKEN" "$API_URL?page=1&per_page=$per_page")
echo "$response"
total_pages=$(echo "$response" | jq '.result_info.total_pages')
echo "Total pages: $total_pages"

page=$total_pages
while [ $page -gt 1 ]; do
  echo "Processing page: $page"
  response=$(curl -s -H "Authorization: Bearer $API_TOKEN" "$API_URL?page=$page&per_page=$per_page")
  echo "$response" | jq -c '.result[] | select(.environment == "preview") | {id: .id, created_on: .created_on, environment: .environment}' | while read -r dep; do
    dep_id=$(echo "$dep" | jq -r '.id')
    dep_date=$(echo "$dep" | jq -r '.created_on')
    dep_environment=$(echo "$dep" | jq -r '.environment')
    if [[ "$dep_date" < "$cutoff" ]]; then
      echo "Deleting $dep_environment deployment $dep_id from $dep_date"
      delete_response=$(curl -s -X DELETE -H "Authorization: Bearer $API_TOKEN" "$API_URL/$dep_id?force=true")
      echo "$delete_response"
      if [[ "$(echo "$delete_response" | jq -r '.success')" != "true" ]]; then
        echo "Failed to delete deployment $dep_id"
        exit 1
      fi
    fi
  done
  page=$((page-1))
done
