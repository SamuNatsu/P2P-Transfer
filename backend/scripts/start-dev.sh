#!/bin/bash

LOG_LEVEL=5 node dist/server.esm.js &
PID=$!

echo $PID > pid
