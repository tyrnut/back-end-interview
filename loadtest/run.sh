#!/bin/bash
pushd "$(dirname "$0")"
docker compose -f ../docker-compose.yaml -f docker-compose.yaml up
popd