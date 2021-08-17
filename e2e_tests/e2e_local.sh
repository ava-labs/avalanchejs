#!/bin/bash

avalanche_testing_image=avaplatform/avalanche-testing:chaos-4-github-action-compilation

dockerfile_contents=$(cat <<EOF
    ####################################################
    # Adds avalanchego binary to avalanche-testing image
    ####################################################
    FROM $avalanche_testing_image
    # Add dev deps
    RUN apt-get update && apt-get install -y git gcc wget
    # go 1.15 install
    RUN wget --quiet https://dl.google.com/go/go1.15.15.linux-amd64.tar.gz
    RUN tar -C /usr/local/ -xf go1.15.15.linux-amd64.tar.gz
    ENV GOROOT=/usr/local/go
    ENV PATH=\$GOROOT/bin:\$PATH
    # nvm/node14 install (solves M1 issue)
    ENV NVM_DIR=/usr/local/nvm
    ENV NODE_VERSION=14.17.5
    RUN mkdir -p \$NVM_DIR
    RUN wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
    ENV NODE_PATH \$NVM_DIR/versions/node/v\$NODE_VERSION/lib/node_modules
    ENV PATH      \$NVM_DIR/versions/node/v\$NODE_VERSION/bin:\$PATH
    # avalanchego download and compilation into /avalanchego/
    ARG avalanchego_branch
    RUN git clone https://github.com/ava-labs/avalanchego /avalanchego/
    WORKDIR /avalanchego/
    RUN git checkout \$avalanchego_branch
    RUN scripts/build.sh
    WORKDIR /run/
EOF
)

avalanchejs_branch=$(git branch --show-current)
[ $avalanchejs_branch = master ] && avalanchego_branch=master || avalanchego_branch=dev
echo Avalanchego branch to use: $avalanchego_branch 

avalanchejs_local_image=avaplatform/avalanche-testing:avalanchejs_local_e2e_$avalanchego_branch
echo Local docker image: $avalanchejs_local_image

docker image inspect $avalanchejs_local_image > /dev/null 2>&1
if [ $? != 0 ] 
then
    echo Image does not exists: building
    echo "$DOCKER_PASS" | docker login --username "$DOCKER_USERNAME" --password-stdin
    docker build -t $avalanchejs_local_image --build-arg avalanchego_branch=$avalanchego_branch - <<< "$dockerfile_contents"
else
    echo Using previously built image
fi

mount_spec=$(pwd):/avalanchejs/

custom_params_json="{
    \"avalanchegoImage\":\"/avalanchego/build/\",
    \"avalancheJsDir\":\"/avalanchejs/\",
    \"executeTests\":[\"AvalancheJS\"]
}"

docker run -v $mount_spec $avalanchejs_local_image ./local-e2e-tests.bin --custom-params-json="${custom_params_json}"

