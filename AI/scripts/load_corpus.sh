#!/usr/bin/env bash
# Load the 16 seeded policy documents through POST /ai/documents, the same endpoint
# an owner uses. Calls Gemini (16 embedding calls), so it is not part of verify.sh.
#
#   ./scripts/load_corpus.sh
#
# Safe to re-run: each file is uploaded first, and only once the new copy exists is
# the old one (same gym, same filename) deleted. A failed upload -- a 429 from the
# 10/min limit, Gemini down -- leaves the old copy in place instead of losing it.
# Run it again after `docker compose down -v`, which wipes /data (Chroma and the
# documents table) along with everything else.
set -euo pipefail
cd "$(dirname "$0")/.."

URL=http://127.0.0.1:8000/ai/documents
docker compose cp scripts/mint_token.py ai:/tmp/mint_token.py >/dev/null 2>&1

for dir in seeder/documents/*/; do
  gym=$(sed -n 's/^gym_name: //p' "$(ls "$dir"*.md | head -1)")
  token=$(docker compose exec -T -w /app -e PYTHONPATH=/app ai python /tmp/mint_token.py admin "$gym")
  auth="Authorization: Bearer $token"
  echo "$gym"

  for file in "$dir"*.md; do
    name=$(basename "$file")
    visibility=$(sed -n 's/^visibility: //p' "$file")
    result=$(curl -s -H "$auth" -F "file=@$file" -F "visibility=$visibility" "$URL")
    echo "  $name ($visibility): $(echo "$result" | jq -c 'if .doc_id then {chunk_count} else .error end')"
    new=$(echo "$result" | jq -r '.doc_id // empty')
    [ -n "$new" ] || continue
    for old in $(curl -sf -H "$auth" "$URL" | jq -r --arg n "$name" --arg new "$new" \
                 '.[] | select(.filename == $n and .doc_id != $new) | .doc_id'); do
      curl -sf -o /dev/null -X DELETE -H "$auth" "$URL/$old"
    done
  done
done
