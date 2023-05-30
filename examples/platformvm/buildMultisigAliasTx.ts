import { Avalanche, BinTools, BN, Buffer } from "caminojs/index"
import {
  PlatformVMAPI,
  UTXOSet,
  UnsignedTx,
  Tx,
  PlatformVMConstants,
  MultisigAliasParams
} from "caminojs/apis/platformvm"
import {
  MultisigKeyChain,
  MultisigKeyPair,
  OutputOwners
} from "caminojs/common"

import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey,
  DefaultLocalGenesisPrivateKey2,
  PChainAlias
} from "caminojs/utils"
import { ExamplesConfig } from "../common/examplesConfig"
import createHash from "create-hash"

const config: ExamplesConfig = require("../common/examplesConfig.json")
const bintools = BinTools.getInstance()
const avalanche: Avalanche = new Avalanche(
  config.host,
  config.port,
  config.protocol,
  config.networkID
)

const privKey1: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
const privKey2: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey2}`
const asOf: BN = new BN(0)
const msigAlias = "P-kopernikus1t5qgr9hcmf2vxj7k0hz77kawf9yr389cxte5j0"

let pchain: PlatformVMAPI

const InitAvalanche = async () => {
  await avalanche.fetchNetworkSettings()
  pchain = avalanche.PChain()
}

const sendMultisigAliasTxCreate = async (): Promise<any> => {
  const pKeychain = pchain.keyChain()
  pKeychain.importKey(privKey1)
  const pAddressStrings = pchain.keyChain().getAddressStrings()

  {
    const newMemo = "100"

    const multisigAliasParams: MultisigAliasParams = {
      memo: newMemo,
      owners: new OutputOwners(
        [pchain.parseAddress(pAddressStrings[0])],
        new BN(0),
        1
      ),
      auth: []
    }

    const unsignedTx: UnsignedTx = await pchain.buildMultisigAliasTx(
      undefined,
      pAddressStrings,
      pAddressStrings,
      multisigAliasParams,
      undefined,
      asOf,
      1
    )

    const tx: Tx = unsignedTx.sign(pKeychain)
    const txid: string = await pchain.issueTx(tx)
    console.log(`Success! TXID: ${txid}`)
  }
}

const sendMultisigAliasTxUpdate = async (): Promise<any> => {
  const pKeychain = pchain.keyChain()
  pKeychain.importKey(privKey1)
  pKeychain.importKey(privKey2)
  const pAddresses = pchain.keyChain().getAddresses()
  const pAddressStrings = pchain.keyChain().getAddressStrings()

  // Those are not serialized back and forth because
  // its so simple and has no methods
  let signatures: [string, string][] = []

  // these are serialized to test if their methods are
  // working properly
  let unsignedTxHex: string = ""
  let outputOwnersHex: string = ""

  // simulate tx creation
  {
    const alias = await pchain.getMultisigAlias(msigAlias)

    const newMemo = "101"

    const platformVMUTXOResponse: any = await pchain.getUTXOs([msigAlias])
    const utxoSet: UTXOSet = platformVMUTXOResponse.utxos

    const multisigAliasParams: MultisigAliasParams = {
      id: pchain.parseAddress(msigAlias),
      memo: newMemo,
      owners: new OutputOwners(
        alias.addresses.map((address: string) => pchain.parseAddress(address)),
        new BN(0),
        1
      ),
      auth: [[0, pchain.parseAddress(msigAlias)]]
    }

    const unsignedTx: UnsignedTx = await pchain.buildMultisigAliasTx(
      utxoSet,
      [[msigAlias], pAddressStrings],
      [msigAlias],
      multisigAliasParams,
      undefined,
      asOf,
      alias.threshold
    )

    // turn it into a hex blob
    unsignedTxHex = unsignedTx.toBuffer().toString("hex")
    outputOwnersHex = OutputOwners.toArray(
      unsignedTx.getTransaction().getOutputOwners()
    ).toString("hex")

    // simulate signing
    {
      // deserialize
      let unsignedTx = new UnsignedTx()
      unsignedTx.fromBuffer(Buffer.from(unsignedTxHex, "hex"))

      // Create the hash from the tx
      const txbuff = unsignedTx.toBuffer()
      const msg: Buffer = Buffer.from(
        createHash("sha256").update(txbuff).digest()
      )

      for (let address of pAddresses) {
        // We need the keychain for signing
        const keyPair = pKeychain.getKey(address)
        // The signature
        const signature = keyPair.sign(msg)
        // save the signature
        signatures.push([keyPair.getAddressString(), signature.toString("hex")])
      }
    }

    // simulate reconstruciton
    {
      // load msig configuration from node
      const msigAliasBuffer = pchain.parseAddress(msigAlias)
      const owner = await pchain.getMultisigAlias(msigAlias)

      // deserialize
      let unsignedTx = new UnsignedTx()
      unsignedTx.fromBuffer(Buffer.from(unsignedTxHex, "hex"))

      // parse and set output owners - are requried for msig resolving
      let parsedOwners: OutputOwners[] = OutputOwners.fromArray(
        Buffer.from(outputOwnersHex, "hex")
      )
      unsignedTx.getTransaction().setOutputOwners(parsedOwners)

      const txbuff = unsignedTx.toBuffer()
      const msg: Buffer = Buffer.from(
        createHash("sha256").update(txbuff).digest()
      )

      // create MSKeychein to create proper signidx
      const msKeyChain = new MultisigKeyChain(
        avalanche.getHRP(),
        PChainAlias,
        msg,
        PlatformVMConstants.SECPMULTISIGCREDENTIAL,
        unsignedTx.getTransaction().getOutputOwners(),
        new Map([
          [
            msigAliasBuffer.toString("hex"),
            new OutputOwners(
              owner.addresses.map((a) => bintools.parseAddress(a, "P")),
              new BN(owner.locktime),
              owner.threshold
            )
          ]
        ])
      )

      // load the signatures from the store/map/signavault
      for (let [addressString, hexSignature] of signatures) {
        let address = pchain.parseAddress(addressString)
        let signature = Buffer.from(hexSignature, "hex")
        msKeyChain.addKey(new MultisigKeyPair(msKeyChain, address, signature))
      }

      msKeyChain.buildSignatureIndices()

      // Apply the signatures and send the tx
      const tx: Tx = unsignedTx.sign(msKeyChain)
      const txid: string = await pchain.issueTx(tx)
      console.log(`Success! TXID: ${txid}`)
    }
  }
}

const main = async (): Promise<any> => {
  await InitAvalanche()
  try {
    await sendMultisigAliasTxCreate()
    await sendMultisigAliasTxUpdate()
  } catch (e) {
    console.log(e)
  }
}

main()
