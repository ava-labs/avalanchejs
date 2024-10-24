import { createDefaultEsmPreset, type JestConfigWithTsJest } from 'ts-jest';

const preset = createDefaultEsmPreset();

const jestConfig: JestConfigWithTsJest = {
  ...preset,
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  coverageProvider: 'v8',
  // Experimental to fix issues with BigInt serialization
  // See: https://jestjs.io/docs/configuration#workerthreads
  // @ts-expect-error - workerThreads is not in the type definition
  workerThreads: true,
};

export default jestConfig;
