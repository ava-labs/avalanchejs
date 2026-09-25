/*
This file contains the configuration for semantic release, the library we use to tag the correct 
semantic version numbers onto releases. We have two release paths, one on main and one on release branch. 

To test run this file, first get a github token at https://github.com/settings/tokens,
add it to the GITHUB_TOKEN env variable and check out the branch you want to test (master or release)

$ export GITHUB_TOKEN=<token>
$ yarn run semantic-release -d --no-ci


*/

const commitAnalyzerSetting = [
  '@semantic-release/commit-analyzer',
  {
    preset: 'angular',
  },
];

const githubSetting = [
  '@semantic-release/github',
  {
    assets: [{ path: 'dist/index.js', label: 'SDK Distributable' }],
    failTitle: false,
    successComment: false,
    failComment: false,
    labels: false,
  },
];

const npmRelease = [
  '@semantic-release/npm',
  {
    npmPublish: false,
  },
];

const changelogGen = ['@semantic-release/changelog', {}];

const releaseNotesGen = ['@semantic-release/release-notes-generator', {}];

// release is protected (PRs and signed commits only), so no plugin may push commits to it
const plugins = [
  commitAnalyzerSetting,
  githubSetting,
  changelogGen,
  releaseNotesGen,
  npmRelease,
];

module.exports = {
  branches: [
    {
      name: 'release',
    },
    {
      name: 'master',
      prerelease: 'alpha',
    },
  ],
  plugins,
};
