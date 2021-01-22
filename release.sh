#!/bin/bash

set -euxo pipefail

npx standard-version
npm run build

# git push --follow-tags origin main

npm publish dist/libs/sherlock --access public
npm publish dist/libs/sherlock-rxjs --access public
npm publish dist/libs/sherlock-utils --access public
npm publish dist/list/ngx-sherlock --access public
