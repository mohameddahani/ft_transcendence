#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Generates a self-signed SSL certificate for local development.
#
# Usage:
#   chmod +x devops/scripts/gen-self-signed-cert.sh
#   ./devops/scripts/gen-self-signed-cert.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e  # exit immediately on any error

CERT_DIR="$(dirname "$0")/../nginx/certs"
mkdir -p "$CERT_DIR"

echo "→ Generating self-signed certificate in $CERT_DIR"

openssl req -x509 \
  -nodes \
  -days 365 \
  -newkey rsa:2048 \
  -keyout "$CERT_DIR/self-signed.key" \
  -out    "$CERT_DIR/self-signed.crt" \
  -subj "/C=MA/ST=Casablanca/L=Casablanca/O=GymApp Dev/OU=DevOps/CN=localhost"

echo "✓ Certificate generated:"
echo "  $CERT_DIR/self-signed.crt"
echo "  $CERT_DIR/self-signed.key"
echo ""
echo "⚠  This is a self-signed cert — browsers will warn about it."