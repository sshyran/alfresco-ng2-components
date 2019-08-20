#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd $DIR/../../../

rm -rf tmp && mkdir tmp;

npm install @alfresco/adf-cli@alpha
./node_modules/@alfresco/adf-cli/bin/adf-cli update-commit-sha --pointer "HEAD" --pathPackage "$(pwd)"

if [[ $TRAVIS_PULL_REQUEST == "false" ]];
then
    if [[ $TRAVIS_BRANCH == "development" ]];
    then
        ./node_modules/@alfresco/adf-cli/bin/adf-cli update-version --alpha --pathPackage "$(pwd)" || exit 1;
    fi

    ./scripts/npm-build-all.sh || exit 1;
else
    ./node_modules/@alfresco/adf-cli/bin/adf-cli update-version --alpha --pathPackage "$(pwd)" || exit 1;
    npm install;
    ./scripts/lint.sh || exit 1;
    ./scripts/smart-build.sh -b $TRAVIS_BRANCH  -gnu || exit 1;
fi;

echo "====== Build Demo shell dist ====="
npm run build:dist || exit 1;

echo "====== License Check ====="
npm run license-checker
