#!/bin/bash

LOG_LEVEL=5 node dist/server.esm.js &
echo $! > pid
