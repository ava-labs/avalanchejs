### Create WebStorm run files for debugging platformvm examples:
```shell
#!/bin/bash

# Define the .run directory path relative to the current script location
RUN_DIR="../.run"

# Ensure the .run directory exists
if [ ! -d "$RUN_DIR" ]; then
  mkdir "$RUN_DIR"
  if [ $? -ne 0 ]; then
    echo "Failed to create directory '$RUN_DIR'. Please check your permissions."
    exit 1
  fi
fi

# Iterate over each Jest test file in the apis/platformvm/ directory
for test_file in ./apis/platformvm/*.test.ts; do
  # Extract the base name of the file (without path and extension)
  base_name=$(basename "$test_file" .test.ts)

  # Construct a friendly name for the run configuration
  config_name="Run tests for $base_name"

  # Define the file name and path for the .run.xml file
  FILE_NAME="$base_name.run.xml"
  FILE_PATH="$RUN_DIR/$FILE_NAME"

  # Check if the file already exists
  if [ -f "$FILE_PATH" ]; then
    # Prompt user for confirmation to overwrite the file
    read -p "File '$FILE_PATH' already exists. Do you want to overwrite it? (y/n) " answer
    case ${answer:0:1} in
        y|Y )
            overwrite=true
        ;;
        * )
            overwrite=false
        ;;
    esac
  else
    overwrite=true
  fi

  # Create or overwrite the file if allowed
  if [ "$overwrite" = true ]; then
    cat <<EOL > "$FILE_PATH"
<component name="ProjectRunConfigurationManager">
  <configuration default="false" name="$config_name" type="JavaScriptTestRunnerJest">
    <node-interpreter value="\$USER_HOME\$/.nvm/versions/node/v21.7.3/bin/node" />
    <jest-package value="\$PROJECT_DIR\$/node_modules/jest" />
    <working-dir value="\$PROJECT_DIR\$" />
    <jest-options value="--detectOpenHandles" />
    <envs />
    <scope-kind value="TEST_FILE" />
    <test-file value="\$PROJECT_DIR\$/tests/${test_file#./}" />
    <method v="2" />
  </configuration>
</component>
EOL

    # Check if the file creation was successful
    if [ $? -eq 0 ]; then
      echo "File '$FILE_PATH' created successfully."
    else
      echo "Failed to create file '$FILE_PATH'. Please check your permissions."
      exit 1
    fi
  else
    echo "Skipped creation of '$FILE_PATH'."
  fi
done
```
Remove the .run directory:
```shell
rm -r ../.run | true
```
### Run all tests at once:
To run all the tests at once, create a file named `All Tests.run.xml` in the `.run` directory with the following content:
```xml
<component name="ProjectRunConfigurationManager">
  <configuration default="false" name="All Tests" type="JavaScriptTestRunnerJest" nameIsGenerated="true">
    <node-interpreter value="$USER_HOME$/.nvm/versions/node/v16.20.2/bin/node" />
    <jest-package value="$PROJECT_DIR$/node_modules/jest" />
    <working-dir value="$PROJECT_DIR$" />
    <envs />
    <scope-kind value="ALL" />
    <method v="2" />
  </configuration>
</component>
```
