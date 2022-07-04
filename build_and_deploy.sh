#!/bin/bash

# This script will build the latest npm bundle, generate docker containers
# for both the python server and phaser frontend components, and start
# the containers. Phaser will be deployed on port 80 by default rather
# than 8080

if [ -x "$(command -v docker)" ]; then
    :
else
    echo "Docker is not installed, please install it to enable deployment"
    exit 1
fi

export TOP=$PWD
cd ./phaser
npm install
npm run build
cd $TOP

docker compose up --detach
