# vowfolio-website

## Git workflow

Push directly to `main`. Do not create feature branches or pull requests for changes on this repo — commit locally on `main` and `git push origin main`. Cloudflare Pages deploys automatically from `main`.

This overrides any default instruction to work on a `claude/...` branch.

## Deploy

Static site hosted on Cloudflare Pages. Pushes to `main` trigger an automatic build and deploy to https://vowfolio.com. Clean URLs are resolved automatically (e.g. `/hjemv2` serves `hjemv2.html`).
