#!/bin/bash

if [ -f "pid" ]; then
  PID=$(cat pid)
  rm pid

  kill -s SIGINT $PID
fi
