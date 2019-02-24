#!/bin/bash

mkdir -p public
mkdir -p public/assets
cp src/index.html public
cp src/manifest.webmanifest public
cp src/style.css public
cp -r node_modules/@webcomponents public/assets
cp -r node_modules/systemjs/dist public/assets/systemjs
ls public/assets
