import { PubSub } from "avalanche/dist"

const main = async (): Promise<any> => {
  const pubsub: PubSub = new PubSub()
  const maxElements: number = 1000
  const collisionProb: number = 0.0001
  const newBloom: string = pubsub.newBloom()
  console.log(newBloom)
}

main()
