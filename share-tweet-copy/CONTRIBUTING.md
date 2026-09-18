# Share Tweet Copy Contributing Guide

Hi! Thank you for contributing.

Repository-wide rules (header template, versioning, `npm test`, publishing) live in the root [CONTRIBUTING.md](../CONTRIBUTING.md). This file only covers what is specific to this script.

## Pull Request
1. fork this repository.
2. git clone your fork repository.
3. open the repository with your IDE.
4. change the code your want, then commit, push, and open the PR request.

## Developing Guidelines
- `script.user.js`, the tampermonkey script, for every users, publish to greasyfork.
- `dev.user.js`, the debug script, for developer to debug, don't need publish.

When we is developing this tampermonkey script, don't care about script store(greasyfork), this's published online.
And We don't use the online script. I wish use the local script.

**If you have been install this tampermonkey script, disable that. Don't use the online script and local script in the same time.**

1. **Start the local server**: from the repo root run `sh dev.sh`. It serves the repo at `http://localhost:3000`.
2. **Use dev script**: import `dev.user.js` into Tampermonkey. Its `@require` already points at `http://localhost:3000/share-tweet-copy/script.user.js`, so every page reload pulls your current `script.user.js`. No special Tampermonkey permission is needed for `http://localhost:3000`; only the commented `file:///` alternative requires file URL access (see [FAQ Q204](https://www.tampermonkey.net/faq.php#Q204)).
3. **Tweak the dev environment**: `dev.user.js` sets `ENV_MODE` and `ENV_USER_TEMPLATE` via `GM_setValue`; edit its body to try other copy templates.
4. **check is working**: browse the match link, use devtool's control panel to debug the script.
5. **happy coding**: ...

Alternative `@require` sources (local `file:///` path, or the published GreasyFork URL) are kept as comments inside `dev.user.js`; swap one into the header if you cannot run the local server.

## Advanced

[Rapid development](https://www.tampermonkey.net/index.php?browser=chrome&locale=en#rapid-development): Use Tampermonkey Editors extension to edit the script at vscode.dev.

```
Requirements:
At the moment Tampermonkey BETA 4.19.6176+ is required (the stable version will follow)
```