#!/usr/bin/env bash
# Serve the site locally at http://localhost:4000 with live reload (Ctrl+C to stop).
# Run scripts/setup-mac.sh once first.
set -euo pipefail
cd "$(dirname "$0")/.."
for b in /opt/homebrew/bin/brew /usr/local/bin/brew; do [ -x "$b" ] && eval "$("$b" shellenv)" && break; done
eval "$(rbenv init - bash)"
rbenv shell "$(cat .ruby-version)"
bundle exec jekyll serve --livereload --open-url
