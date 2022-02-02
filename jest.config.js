const { pathsToModuleNameMapper } = require("ts-jest/utils")

module.exports = {
  preset: "ts-jest",
  verbose: true,
  testEnvironment: "node",
  roots: ["<rootDir>/src", "<rootDir>/tests", "<rootDir>/__mocks__"],
  testMatch: [
    "**/__tests__/**/*.+(ts|tsx|js)",
    "**/?(*.)+(spec|test).+(ts|tsx|js)"
  ],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest"
  },
  transformIgnorePatterns: ["<rootDir>/node_modules/"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  moduleDirectories: ["node_modules", "src"],
  collectCoverage: true,
  coverageReporters: ["html"],
  modulePathIgnorePatterns: ["node_modules"],
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.json"
    }
  },
  moduleNameMapper: {
    "^src(.*)$": "<rootDir>/src$1"
  },
  testSequencer: "<rootDir>/e2eSequencer.js"
}