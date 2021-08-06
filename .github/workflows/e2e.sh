mount_spec=/home/runner/work/avalanchejs/avalanchejs/:/avalanchejs/
image=avaplatform/avalanche-testing:chaos-4 

echo "$DOCKER_PASS" | docker login --username "$DOCKER_USERNAME" --password-stdin

docker run -v $mount_spec $image \
    scripts/executions/local-e2e-tests.sh --jsdir=/avalanchejs/ --tests="\"AvalancheJS\"" --runlocal=./local-e2e-tests.bin \
    --branch=master --repo=public
