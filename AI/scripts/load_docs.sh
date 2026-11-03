#!/bin/sh
# dev only: uploads the demo documents of the 4 seeded gyms through the API, as each gym's owner
# run from AI/ while the stack is up: ./scripts/load_docs.sh
loaded=0
total=0
for pair in atl:atlas oas:oasis tit:titan med:medina; do
  dir=${pair%%:*}
  gym=${pair#*:}
  token=$(docker compose exec -T ai python - admin "$gym" < scripts/mint_token.py)
  for file in seeder/documents/"$dir"/*.md; do
    case $(basename "$file") in
      pricing-authority.md|operations-manual.md) visibility=staff ;;
      *) visibility=member ;;
    esac
    total=$((total + 1))
    # a second try, because Gemini sometimes times out
    for try in 1 2; do
      code=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $token" \
             -F "file=@$file" -F "visibility=$visibility" localhost:8000/ai/documents)
      [ "$code" = 200 ] && break
    done
    echo "$gym  $(basename "$file")  $code"
    [ "$code" = 200 ] && loaded=$((loaded + 1))
  done
done
echo "$loaded/$total documents loaded"
[ "$loaded" = "$total" ]
