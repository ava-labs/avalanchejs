import { PubSub } from "avalanche/dist"

const main = async (): Promise<any> => {
  const pubsub: PubSub = new PubSub()
  const newSet: string = pubsub.newSet()
  console.log(newSet)
}

main()
