import HDNode from "avalanche/dist/utils/hdnode"
import { Buffer } from "buffer/"

const main = async (): Promise<any> => {
  const seed: string =
    "a0c42a9c3ac6abf2ba6a9946ae83af18f51bf1c9fa7dacc4c92513cc4dd015834341c775dcd4c0fac73547c5662d81a9e9361a0aac604a73a321bd9103bce8af"
  const fromSeed: HDNode = new HDNode(seed)
  const msg: string = "bb413645935a9bf1ecf0c3d30df2d573"
  const sig: Buffer = fromSeed.sign(Buffer.from(msg))
  const verify: boolean = fromSeed.verify(Buffer.from(msg), sig)
  console.log(verify)
}

main()
