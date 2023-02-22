# AvalancheJS

## Supported Platforms

This library is intended for use in Node.js (`^16.13 || ^18`) and in browsers.

> For Node.js 16, a polyfill for `fetch` is required.

## Run the examples

There are examples in the examples folder. These can be run with `npx @digitak/esrun`

1. cd into the examples folder
2. run `npx @digitak/esrun` with the path to the file as the arguement

I am reading that you can use `ts-node` as well with the --esm flag but I am yet to see this work

## Release Process

The release process is automated, the process is based on semantic-release and requires that you use conventional commits. If the commit message isnt correct you will be notified upon attempting to commit.

### >=v4

- Branch from develop
- Submit a PR to develop
- That PR will be reviewed and once the process is finished will be merged
- Develop get merged into Master, an alpha version is released
- Alpha will "bake" for some time and will eventually be merged into release branch
- The release branch will cut a official verison

### v3 > v4

This branch is in maintenance mode and will not be supported by the avalabs team. It has been made available to those that need it and want to continue contributing to it.

- Branch from `v3.x.x-legacy`
- Create a PR to the above mentioned branch
- Upon it being merged a version will be published in the 3.x.x range
