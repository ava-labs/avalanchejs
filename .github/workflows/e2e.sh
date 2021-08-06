
branch=$1

mount_spec=$(pwd):/avalanchejs/
image=avaplatform/avalanche-testing:chaos-4 

echo avalanchejs branch: $branch

echo "$DOCKER_PASS" | docker login --username "$DOCKER_USERNAME" --password-stdin

docker run -v $mount_spec $image \
    scripts/executions/local-e2e-tests.sh --jsdir=/avalanchejs/ --tests="\"AvalancheJS\"" --runlocal=/run/local-e2e-tests.bin \
    --branch=master --repo=public
