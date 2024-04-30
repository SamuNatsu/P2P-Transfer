#!/bin/bash

# Start rollup watching
rollup \
  -c rollup.config.ts \
  --configPlugin @rollup/plugin-typescript \
  -w \
  --watch.onStart scripts/stop-dev.sh \
  --watch.onEnd scripts/start-dev.sh
