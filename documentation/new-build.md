# Creating a new AvalancheJS build

First, all changes to the `master` branch of the AvalancheJS repo should be done solely via github pull requests. This is to ensure that only code which has been peer-reviewed ends up in `master`. Next, you need your username added to the [`avalanche` npm package](https://www.npmjs.com/package/avalanche) and also confirm that you enable 2fa on your npm account.

After all the desired changes have been peer-reviewed and merged into the `development` branch then create a final PR to merge `development` in to `master`. Name the PR the new AvalancheJS version name. Ex: `v3.0.4`. In the description list a changelog of the changes which are included in the PR.

When you merge the PR and the latest and greatest are on the `master` branch then run `yarn release:prepare`. This command removes the existing `dist/` and `node_modules/` directories in addition to removing the `yarn.lock` file. Next it installs the dependencies, builds AvalancheJS, bundles the build with webpack and runs the test suite. If all of this is successful then you are ready to push a new build to npm.

For this we use the [`np` lib](https://www.npmjs.com/package/np) to push a new build to npm. `np` will prompt you to answer if this is a PATCH, MINOR or MAJOR release and it will handle bumping the version in `package.json` for you. You will be prompted for your `OTP` which stands for "one time password." This is your 2fa code which you will get from having enabled 2fa on your npm account.

After this is successful you can confirm that the version number was bumped for the npm [`avalanche` npm package](https://www.npmjs.com/package/avalanche). Once you confirm that then the final step is to merge `master` in to the `development` branch. This ensures that the newly bumped version gets added to any future dev work which branches off of `development`.