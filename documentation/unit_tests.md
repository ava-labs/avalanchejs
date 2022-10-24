# Unit Tests

## Run All Tests

```zsh
yarn build && yarn test
```

## Run Granular Tests

You can also be more granular and run individual tests or suites of test. When defining tests you can pass in a string as the first argument to `describe` and `test`.

```ts
describe("SECP256K1", (): void => {
  test("addressFromPublicKey", (): void => {
    // tests
  })
})
```

You can run an individual test by searching off of the text which you passed into `describe` and/or `test`.

```zsh
jest -t "SECP256K1"

PASS  tests/common/secp256k1.test.ts
  SECP256K1
    ✓ addressFromPublicKey (4 ms)

Test Suites: 41 skipped, 1 passed, 1 of 42 total
Tests:       541 skipped, 1 passed, 542 total
Snapshots:   0 total
Time:        11.42 s
Ran all test suites with tests matching "SECP256K1".
```
