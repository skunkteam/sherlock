#!/bin/bash

set -euxo pipefail

npx standard-version
npm run build

# git push --follow-tags origin main

npm publish dist/libs/sherlock --access public
npm publish dist/libs/sherlock-proxy --access public
npm publish dist/libs/sherlock-rxjs --access public
npm publish dist/libs/sherlock-utils --access public
