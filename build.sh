#!/bin/bash

rm -rf ./build
mkdir ./build

cd ./frontend
pnpm install
pnpm generate
cp -r ./dist ../build/www
cd ..

cd ./backend
pnpm install
pnpm build
cp ./dist/server.min.mjs ./package.json ../build
cd ..

