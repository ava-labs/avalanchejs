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
  transformIgnorePatterns: [
    "<rootDir>/node_modules/(?!ethereum-cryptography|keccak)"
  ],
  moduleFileExtensions: ["js", "ts", "json", "jsx", "tsx", "node"],
  moduleDirectories: ["node_modules", "<rootDir>/src"],
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
  testSequencer: "<rootDir>/e2eSequencer.js",
  testTimeout: 300000 // 5 minutes
}
