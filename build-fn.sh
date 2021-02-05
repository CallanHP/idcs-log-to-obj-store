#!/bin/sh
. ./set-local-vars.sh

rm -rf dist
mkdir dist
rsync -aC --exclude node_modules --exclude dist --exclude '.git' --exclude '*.sh' --exclude test --exclude '.gitignore' --exclude '.npmrc' . ./dist
cd dist
fn -v deploy --app $FN_APP_NAME
cd ..
#copy the updated func.yaml back for versioning?
