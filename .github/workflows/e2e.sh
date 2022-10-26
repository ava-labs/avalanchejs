mount_spec=$(pwd):/caminojs/
image=camplatform/camino-testing:master

echo "$DOCKER_PASS" | docker login --username "$DOCKER_USERNAME" --password-stdin
custom_params_json="{
    \"caminogoImage\":\"/caminojs/caminogo/build/\",
    \"testParams\": {\"caminoJS\": { \"dir\": \"/caminojs/\" } },
    \"executeTests\":[\"CaminoJS\"]
}"

docker run -v $mount_spec $image ./local-e2e-tests.bin --custom-params-json="${custom_params_json}"
