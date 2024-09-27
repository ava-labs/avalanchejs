/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  coverageProvider: 'v8',
  extensionsToTreatAsEsm: ['.ts'],
  // Experimental to fix issues with BigInt serialization
  // See: https://jestjs.io/docs/configuration#workerthreads
  workerThreads: true,
};
