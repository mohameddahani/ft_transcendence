#!/bin/sh
# dev only: uploads the demo documents of the 4 seeded gyms through the API, as each gym's owner
# run from AI/ while the stack is up:
#   ./scripts/load_docs.sh        your own setup (AI/docker-compose.yml, port 8000)
#   ./scripts/load_docs.sh team   the team's setup (make): through nginx and the frontend's route
if [ "$1" = team ]; then
  mint="docker exec -i ai"
  url=https://localhost/api/ai/documents
else
  mint="docker compose exec -T ai"
  url=localhost:8000/ai/documents
fi
loaded=0
total=0
for pair in atl:atlas oas:oasis tit:titan med:medina; do
  dir=${pair%%:*}
  gym=${pair#*:}
  token=$($mint python - admin "$gym" < scripts/mint_token.py)
  for file in seeder/documents/"$dir"/*.md; do
    case $(basename "$file") in
      pricing-authority.md|operations-manual.md) visibility=staff ;;
      *) visibility=member ;;
    esac
    total=$((total + 1))
    # a second try, because Gemini sometimes times out
    for try in 1 2; do
      # the AI reads the header; the frontend's route reads the login cookie (-k: its certificate is self-signed)
      code=$(curl -sk -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $token" -b "auth_token=$token" \
             -F "file=@$file" -F "visibility=$visibility" "$url")
      [ "$code" = 200 ] && break
    done
    echo "$gym  $(basename "$file")  $visibility  $code"
    [ "$code" = 200 ] && loaded=$((loaded + 1))
  done
done
echo "$loaded/$total documents loaded"
[ "$loaded" = "$total" ]
