#!/bin/bash

set -euxo pipefail

npx standard-version "$@"

read -p "Press enter to continue to build step"

npm run build

read -p "Press enter to continue to NPM publish"

npm publish dist/libs/sherlock --access public
npm publish dist/libs/sherlock-utils --access public
npm publish dist/libs/ngx-sherlock --access public

echo "Run:"
echo "git push --follow-tags origin main"