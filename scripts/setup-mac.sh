#!/usr/bin/env bash
# One-time setup for building this site with Jekyll on a Mac, then serve it.
# Usage:  bash scripts/setup-mac.sh        (run from anywhere)
set -euo pipefail
cd "$(dirname "$0")/.."
RUBY_VERSION="$(cat .ruby-version)"

step() { printf '\n\033[1;34m==> %s\033[0m\n' "$1"; }

step "Checking Apple command-line tools"
if ! xcode-select -p >/dev/null 2>&1; then
  xcode-select --install || true
  echo "A window opened to install Apple's command-line tools."
  echo "Click Install, wait for it to finish, then run this script again."
  exit 1
fi

step "Checking Homebrew"
if ! command -v brew >/dev/null 2>&1; then
  for b in /opt/homebrew/bin/brew /usr/local/bin/brew; do
    [ -x "$b" ] && eval "$("$b" shellenv)" && break
  done
fi
if ! command -v brew >/dev/null 2>&1; then
  echo "Homebrew isn't installed. Install it from https://brew.sh (paste the one-line"
  echo "command shown there into Terminal), then run this script again."
  exit 1
fi

step "Installing rbenv (Ruby version manager)"
brew list rbenv >/dev/null 2>&1 || brew install rbenv ruby-build
brew upgrade ruby-build >/dev/null 2>&1 || true
eval "$(rbenv init - bash)"

step "Installing Ruby $RUBY_VERSION (first time takes a few minutes)"
rbenv install --skip-existing "$RUBY_VERSION"
rbenv shell "$RUBY_VERSION"
ruby -v

step "Installing the site's gems"
gem install bundler --conservative --no-document
bundle config set --local path vendor/bundle
bundle install

step "Building the site and checking links and images"
bundle exec jekyll build
bundle exec htmlproofer _site --disable-external --no-enforce-https --ignore-urls "/github.com/"

step "Done. Starting the local server at http://localhost:4000 (Ctrl+C to stop)"
echo "Next time, just run:  bash scripts/serve.sh"
bundle exec jekyll serve --livereload --open-url
