#!/bin/sh
# ask the AI assistant a question and see only the answer (no raw SSE events)
# usage: ./scripts/ask.sh <role> <gym> [question]
#   role: admin, staff, member
#   gym:  atlas, oasis, titan, medina (for admin/staff) or email (for member)
#
# examples:
#   ./scripts/ask.sh admin atlas "How is the gym doing today?"
#   ./scripts/ask.sh staff atlas "What discount can I give?"
#   ./scripts/ask.sh member omar@gmail.com "When does my membership end?"
#   ./scripts/ask.sh admin atlas   (no question = interactive mode, type questions one by one)
set -e

ROLE=${1:?usage: ask.sh <role> <gym> [question]}
GYM=${2:?usage: ask.sh <role> <gym> [question]}

TOKEN=$(docker compose exec -T ai python - "$ROLE" "$GYM" < scripts/mint_token.py)

ask() {
  question="$1"
  thread="$2"
  body="{\"question\": \"$question\""
  [ -n "$thread" ] && body="$body, \"thread_id\": \"$thread\""
  body="$body}"

  # curl streams the SSE events; we extract the answer and tool names
  response=$(curl -sN -X POST localhost:8000/ai/chat \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$body" 2>&1)

  # extract the thread_id from the start event
  thread_id=$(echo "$response" | grep '^data:' | head -1 | sed 's/.*"thread_id": *"//;s/".*//')

  # show which tools were called
  tools=$(echo "$response" | grep '"type": *"tool"' | sed 's/.*"name": *"//;s/".*//')
  if [ -n "$tools" ]; then
    printf "\033[90m[tools: %s]\033[0m\n" "$(echo $tools | tr '\n' ', ' | sed 's/,$//')"
  fi

  # show the answer (join all token texts)
  echo "$response" | grep '"type": *"token"' | sed 's/.*"text": *"//;s/".*//;s/\\n/\n/g' | tr -d '\n'
  echo ""

  # return the thread_id for follow-ups
  THREAD_ID="$thread_id"
}

if [ -n "$3" ]; then
  # single question mode
  ask "$3"
else
  # interactive mode
  THREAD_ID=""
  printf "\033[1mAI assistant (%s @ %s) — type a question, Ctrl-C to quit\033[0m\n\n" "$ROLE" "$GYM"
  while printf "\033[36m> \033[0m" && read -r question; do
    [ -z "$question" ] && continue
    echo ""
    ask "$question" "$THREAD_ID"
    echo ""
  done
fi
