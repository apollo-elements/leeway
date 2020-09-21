#!/bin/bash

mkdir -p build
mkdir -p build/assets
cp src/index.html build
cp src/manifest.webmanifest build
cp src/style.css build
cp -r node_modules/@webcomponents build/assets
cp -r node_modules/systemjs/dist build/assets/systemjs
ls build/assets
