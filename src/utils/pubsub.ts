export default class PubSub {
  newSet() {
    return JSON.stringify({ newSet: {} })
  }
  newBloom(maxElements: number = 1000, collisionProb: number = 0.01) {
    return JSON.stringify({
      newBloom: {
        maxElements: maxElements,
        collisionProb: collisionProb
      }
    })
  }
  addAddresses(addresses: string[]) {
    return JSON.stringify({
      addAddresses: {
        addresses: addresses
      }
    })
  }
}
