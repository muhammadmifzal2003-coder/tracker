#!/usr/bin/env bash
# Run before every push: static analysis (Semgrep) + secret scan (gitleaks).
set -euo pipefail
echo "== Semgrep =="
semgrep scan --config auto --error --quiet --exclude node_modules --exclude .next .
echo "== gitleaks (git history) =="
gitleaks detect --no-banner --redact
echo "== gitleaks (working tree) =="
gitleaks detect --no-banner --redact --no-git --source . -c .gitleaks.toml
echo "Scan clean."
