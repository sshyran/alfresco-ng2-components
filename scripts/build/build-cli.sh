#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd $DIR/../../lib/cli/

echo "====== Cli ======"
echo "====== Build ======"
npm run dist

cd $DIR/../../
cp -R ./lib/cli/dist lib/dist/cli/
