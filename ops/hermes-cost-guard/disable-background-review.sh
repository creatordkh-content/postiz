#!/bin/sh
# Run from the Railway hermes-social Console; never print config contents.
set -eu
export HERMES_HOME=/opt/data

hermes config set auxiliary.background_review.enabled false >/dev/null
echo 'configured: main'

for file in /opt/data/profiles/*/config.yaml; do
  [ -f "$file" ] || continue
  profile=${file%/config.yaml}
  profile=${profile##*/}
  if hermes -p "$profile" config set auxiliary.background_review.enabled false >/dev/null 2>&1; then
    echo "configured: $profile"
  elif ! grep -q '^auxiliary:' "$file"; then
    # Some Ruang-created folders have configs but no Hermes profile registration.
    printf '\nauxiliary:\n  background_review:\n    enabled: false\n' >> "$file"
    echo "configured: $profile (unregistered folder)"
  else
    echo "manual review required: $profile" >&2
  fi
done
