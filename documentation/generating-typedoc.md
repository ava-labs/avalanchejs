# CaminoJS -  Typedoc Documentation

## Overview

We use [typedoc](https://typedoc.org) to turn comments in our typescript into markdown pages which can be copied into [the CaminoJS Docs repo](https://github.com/chain4travel/caminojs-docs). Each time a new version of CaminoJS gets deployed to [npm](https://www.npmjs.com/package/@c4tplatform/caminojs) then typedocs should be regenerated and pasted into the both docs repo previously mentioned.

## Steps

### Dependencies

A recent build of one of the typedoc dependencies broke this workflow so for now make sure that the dependencies are the following versions.

```json
"typedoc": "^0.18.0",
"typedoc-plugin-external-module-name": "^4.0.3",
"typedoc-plugin-markdown": "^2.4.0",
```

### Generate Docs

Generate typedocs using the `docsmd` yarn/npm script.

```zsh
yarn docsmd
Rendering [========================================] 100%

Documentation generated at /path/to/caminojs/docsMD

✨  Done in 8.09s.
```

This will generate `README.md` and 3 directories, `classes/`, `interfaces/` and `modules/` in the `docsMD/` directory of your local `caminojs/` repo.

### API

First, if any new files were generated in `README.md` then rename the newly generated `README.md` to `api.md`. Next open `api.md` and clean up the formatting.

* Remove the generated headers and replace them w/ API and CaminoJS w/ a link to the current build
* Nest the list items per their parent category
* Clean up the body copy. Ex: `API-AVM` -> `AVM` and `API-AVM-Credentials` -> `Credentials`

## Copy to Docs Repo

Now copy the `api.md` file into the `/path/to/docs/apis/tools/caminojs/` directory of your local `camino-docs/` repo.

Next copy 3 directories, `classes/`, `interfaces/` and `modules/` into the `/path/to/caminojs-docs/` directory of your local `caminojs-docs/` repo.

Confirm that everything worked by running `yarn start` and viewing the new CaminoJS docs on `localhost`. If that is successful next run `yarn build` to confirm that docusaurus is able to properly build. Once that is successful, branch off of `master`, commit your changes and push them on your new feature branch to the remote `camino-docs` repo and create a PR.