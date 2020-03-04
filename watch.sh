#!/usr/bin/env bash

export UUID=$(uuidgen)
skaffold run -p dev

echo ""
echo "Now watching for changes to the source code..."

 /usr/lib/node_modules/watch-cli/bin/watch -p "*" -c "UUID=$(uuidgen) && skaffold run -p dev"
