
mount_spec=$(pwd):/avalanchejs/
image=avaplatform/avalanche-testing:chaos-4-github-action-compilation

echo "$DOCKER_PASS" | docker login --username "$DOCKER_USERNAME" --password-stdin

custom_params_json="{
    \"avalanchegoImage\":\"/avalanchejs/avalanchego/build/\",
    \"avalancheJsDir\":\"/avalanchejs/\",
    \"executeTests\":[\"AvalancheJS\"]
}"

docker run -v $mount_spec $image ./local-e2e-tests.bin --custom-params-json="${custom_params_json}"

