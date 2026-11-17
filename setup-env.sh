#!/bin/sh

# Creates every service's .env from its .env.example, generates secrets, and
# reports required values that are still empty. Safe to re-run: it never
# overwrites a value that is already set and never adds missing variables.
#
# Markers, placed on the line(s) right before a variable in a .env.example:
#   # @generate [hex|base64url]   fill with a random secret if the value is empty
#   # @required                   the user must set it, reported if empty

set -e

ROOT=$(cd "$(dirname "$0")" && pwd)

gen() {
  case "$1" in
    base64url) openssl rand -base64 48 | tr '+/' '-_' | tr -d '=\n' ;;
    *)         openssl rand -hex 32 ;;
  esac
}

has_key() { grep -q "^$2=" "$1"; }
is_empty() { grep -Eq "^$2=(\"\"|'')?[[:space:]]*$" "$1"; }
set_value() { sed -i "s|^$2=.*|$2=\"$3\"|" "$1"; }

# Prints "<kind> <key> <type>" for each marked variable of a .env.example
markers() {
  awk '
    /^# @generate/ { kind = "generate"; type = $3; next }
    /^# @required/ { kind = "required"; type = "";  next }
    /^[[:space:]]*$/ { kind = ""; type = ""; next }
    /^[[:space:]]*#/ { next }
    /^[A-Za-z_][A-Za-z0-9_]*=/ {
      if (kind != "") { split($0, kv, "="); print kind, kv[1], type }
      kind = ""; type = ""
    }
  ' "$1"
}

list=$(mktemp)
trap 'rm -f "$list"' EXIT
find "$ROOT" -name .env.example -not -path '*/node_modules/*' | sort > "$list"

missing=""
while read -r example; do
  env="${example%.example}"
  rel="${env#"$ROOT"/}"

  # 1. create the .env if it does not exist
  if [ ! -f "$env" ]; then
    cp "$example" "$env"
    echo "created   $rel"
  fi

  # 2. generate empty secrets, and collect required values that are empty
  while read -r kind key type; do
    [ -n "$kind" ] || continue
    case "$kind" in
      generate)
        if is_empty "$env" "$key"; then
          set_value "$env" "$key" "$(gen "$type")"
          echo "generated $rel: $key"
        fi
        ;;
      required)
        if ! has_key "$env" "$key" || is_empty "$env" "$key"; then
          missing="${missing}
  ${rel}: ${key}"
        fi
        ;;
    esac
  done <<MARKERS
$(markers "$example")
MARKERS
done < "$list"

if [ -n "$missing" ]; then
  echo
  echo "These required values are still empty. Fill them in, then run make up:$missing"
  exit 1
fi
echo "Environment ready."
