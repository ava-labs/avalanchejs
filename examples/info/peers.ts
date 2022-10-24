import { Avalanche } from "@c4tplatform/caminojs/dist"
import { InfoAPI } from "@c4tplatform/caminojs/dist/apis/info"
import { PeersResponse } from "@c4tplatform/caminojs/dist/apis/info/interfaces"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 12345
const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID)
const info: InfoAPI = avalanche.Info()

const main = async (): Promise<any> => {
  const peers: PeersResponse[] = await info.peers([])
  console.log(peers)
}

main()
