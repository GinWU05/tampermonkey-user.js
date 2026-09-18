#! /bin/bash

# Serve the repo root on http://localhost:3000 so each <dir>/dev.user.js can
# @require http://localhost:3000/<dir>/script.user.js for local debugging.
# Usage: sh dev.sh

cd "$(dirname "$0")" && npx serve -l 3000 .
