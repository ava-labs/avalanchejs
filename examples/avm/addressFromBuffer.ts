import { Avalanche, Buffer, BinTools } from "../../dist"
import { AVMAPI } from "../../dist/apis/avm"

const bintools: BinTools = BinTools.getInstance()
// const ip: string = "localhost"
// const port: number = 9650
// const protocol: string = "http"
// const networkID: number = 12345

const ip: string = "api.avax.network"
const port: number = 443
const protocol: string = "https"
const networkID: number = 1
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const xchain: AVMAPI = avalanche.XChain()

const main = async (): Promise<any> => {
  const tx: string = await xchain.getTx(
    "2fNEUGLxzs9dJEkwqXEUVKYXy34m82NK3pZuztQpKs5HdrQR5J"
  )
  console.log("tx", tx)

  const cb58tx: any = bintools.cb58Decode(tx)
  console.log("cb58tx", cb58tx)

  const string = Buffer.from(cb58tx)
  console.log("string", string.toString("hex"))

  const addressBuffer: Buffer = Buffer.from(string)

  const test: string = bintools.cb58Encode(Buffer.from(addressBuffer))

  console.log(test)
}

main()
