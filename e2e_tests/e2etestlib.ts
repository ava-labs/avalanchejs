import { Avalanche } from "src"

export const getAvalanche = (): Avalanche => {
  if (typeof process.env.CAMINOGO_IP === "undefined") {
    throw "Undefined environment variable: CAMINOGO_IP"
  }
  if (typeof process.env.CAMINOGO_PORT === "undefined") {
    throw "Undefined environment variable: CAMINOGO_PORT"
  }
  const avalanche: Avalanche = new Avalanche(
    process.env.CAMINOGO_IP,
    parseInt(process.env.CAMINOGO_PORT),
    "http",
    process.env.NETWORK_ID ? parseInt(process.env.NETWORK_ID) : 12345
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
  for (const [
    testName,
    promise,
    preprocess,
    matcher,
    expected,
    timeout = -1
  ] of tests_spec) {
    test(testName, async (): Promise<void> => {
      if (timeout > 0) {
        jest.setTimeout(timeout * 2)
        await new Promise((res) => setTimeout(res, timeout))
        jest.setTimeout(5000) // default jest timeout
      }
      if (matcher == Matcher.toBe) {
        expect(preprocess(await promise())).toBe(expected())
      }
      if (matcher == Matcher.toEqual) {
        expect(preprocess(await promise())).toEqual(expected())
      }
      if (matcher == Matcher.toContain) {
        expect(preprocess(await promise())).toEqual(
          expect.arrayContaining(expected())
        )
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
