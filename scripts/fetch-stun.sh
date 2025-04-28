#!/bin/bash

ASSET_PATH="./src-frontend/assets/stun-servers.txt"
LIST_URL="https://cdn.jsdelivr.net/gh/pradt2/always-online-stun@master/valid_ipv4s.txt"

echo "Fetching"

LIST_DATA=$(curl -s "$LIST_URL")
if [ $? != 0 ]; then
  echo "Fail to fetch list"
  exit 1
fi

echo "$LIST_DATA" > "$ASSET_PATH"
echo "Updated"
