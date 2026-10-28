#!/bin/bash
# setup-env.sh — Initializes .env files from templates. Never overwrites.

set -e  # Exit on error

SERVICES=("frontend" "owner-platform" "backend" "devops" "block-chain/api" "AI")

for service in "${SERVICES[@]}"; do
  example_file="./${service}/.env.example"
  target_file="./${service}/.env"

  if [[ ! -f "${example_file}" ]]; then
    echo "⚠️  Missing ${example_file}. Skipping."
    continue
  fi

  if [[ -f "${target_file}" ]]; then
    echo "✅ ${target_file} already exists. Skipping (no overwrite)."
  else
    cp "${example_file}" "${target_file}"
    echo "📝 Created ${target_file}. You must now fill in the real values."
  fi
done

echo ""
echo "🔐 REMINDER: Never commit .env files to Git."
echo "👉 Fill in values manually"