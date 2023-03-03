import { BinTools, Buffer } from "caminojs/index"
const bintools: BinTools = BinTools.getInstance()

const ethPrivateKey =
  "56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027"
const ethPrivateKeyBuf = Buffer.from(ethPrivateKey, "hex")

let cPrivKey = `PrivateKey-` + bintools.cb58Encode(ethPrivateKeyBuf)
console.log(cPrivKey)
