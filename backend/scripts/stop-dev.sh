#!/bin/bash

if [ -f "pid" ]; then
  kill -s SIGINT $(cat pid)
  rm pid
fi
