import { Avalanche } from "src"

export const getAvalanche = (): Avalanche => {
  if (typeof process.env.AVALANCHEGO_IP === "undefined") {
    throw "Undefined environment variable: AVALANCHEGO_IP"
  }
  if (typeof process.env.AVALANCHEGO_PORT === "undefined") {
    throw "Undefined environment variable: AVALANCHEGO_PORT"
  }
  const avalanche: Avalanche = new Avalanche(
    process.env.AVALANCHEGO_IP,
    parseInt(process.env.AVALANCHEGO_PORT)
  )
  return avalanche
}

export enum Matcher {
  toBe,
  toEqual,
  toContain,
  toMatch,
  toThrow,
  Get
}

export const createTests = (tests_spec: any[]): void => {
  for (const [testName, promise, preprocess, matcher, expected] of tests_spec) {
    test(testName, async (): Promise<void> => {
      if (matcher == Matcher.toBe) {
        expect(preprocess(await promise())).toBe(expected())
      }
      if (matcher == Matcher.toEqual) {
        expect(preprocess(await promise())).toEqual(expected())
      }
      if (matcher == Matcher.toContain) {
        expect(preprocess(await promise())).toEqual(expect.arrayContaining(expected()))
      }
      if (matcher == Matcher.toMatch) {
        expect(preprocess(await promise())).toMatch(expected())
      }
      if (matcher == Matcher.toThrow) {
        await expect(preprocess(promise())).rejects.toThrow(expected())
      }
      if (matcher == Matcher.Get) {
        expected().value = preprocess(await promise())
        expect(true).toBe(true)
      }
    })
  }
}

