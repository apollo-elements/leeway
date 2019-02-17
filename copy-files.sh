#!/bin/bash

mkdir -p public
mkdir -p public/assets
cp src/index.html public
cp src/manifest.webmanifest public
cp src/style.css public
cp -r node_modules/@webcomponents public/assets
ls public/assets
