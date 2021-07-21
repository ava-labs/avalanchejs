import { PubSub } from "src"

const pubsub: PubSub = new PubSub()

describe("PubSub", (): void => {
  test("newSet", (): void => {
    const data: string = '{"newSet":{}}'
    const newSet: string = pubsub.newSet()
    expect(newSet).toEqual(data)
  })

  test("newBloom", (): void => {
    const data: string =
      '{"newBloom":{"maxElements":1000,"collisionProb":0.01}}'
    const newBloom: string = pubsub.newBloom()
    expect(newBloom).toEqual(data)
  })

  test("addAddresses", (): void => {
    const data: string =
      '{"addAddresses":{"addresses":["X-avax1wst8jt3z3fm9ce0z6akj3266zmgccdp03hjlaj"]}}'
    const addresses: string[] = [
      "X-avax1wst8jt3z3fm9ce0z6akj3266zmgccdp03hjlaj"
    ]
    const addAddresses: string = pubsub.addAddresses(addresses)
    expect(addAddresses).toEqual(data)
  })
})
