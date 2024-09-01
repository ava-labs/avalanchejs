### Create WebStorm run files for debugging platformvm examples:
```shell
#!/bin/bash

# Define the .run directory path
RUN_DIR="../.run"

# Ensure the .run directory exists
if [ ! -d "$RUN_DIR" ]; then
  mkdir "$RUN_DIR"
  if [ $? -ne 0 ]; then
    echo "Failed to create directory '$RUN_DIR'. Please check your permissions."
    exit 1
  fi
fi

# Iterate over each .ts file in the examples/platformvm/ directory
for ts_file in ../examples/platformvm/*.ts; do
  # Extract the base name of the file (without path and extension)
  base_name=$(basename "$ts_file" .ts)

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
    application_parameters="${ts_file#../}"
    cat <<EOL > "$FILE_PATH"
<component name="ProjectRunConfigurationManager">
  <configuration default="false" name="$base_name" type="NodeJSConfigurationType" application-parameters="$application_parameters" path-to-node="\$USER_HOME\$/.nvm/versions/node/v21.7.3/bin/node" node-parameters="-r tsconfig-paths/register" path-to-js-file="node_modules/ts-node/dist/bin.js" working-dir="\$PROJECT_DIR\$">
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
