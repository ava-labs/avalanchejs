import { getAvalanche, createTests, Matcher } from "../e2etestlib"
import { KeystoreAPI } from "src/apis/keystore/api"
import BN from "bn.js"
import { costImportTx, PayloadBase } from "src/utils"
import { UTXOSet, Tx, UnsignedTx, EVMAPI } from "src/apis/evm"
import { avm, BinTools } from "src"
import { AVMAPI, GetUTXOsResponse } from "src/apis/avm"
import { EVMCaminoConstants } from "../../src/apis/evm/camino_constants"
import { Buffer } from "buffer/"
import createHash from "create-hash"
import {
  UnsignedTx as PlatformUnsignedTx,
  Tx as PlatformTx,
  UTXOSet as PlatformUTXOSet,
  PlatformVMConstants,
  Owner,
  PlatformVMAPI
} from "../../src/apis/platformvm"
import {
  MultisigKeyChain,
  MultisigKeyPair,
  OutputOwners,
  ZeroBN
} from "../../src/common"
import { CChainAlias, PChainAlias } from "../../src/utils"

const bintools = BinTools.getInstance()
const avalanche = getAvalanche()
const user: string = "avalancheJspChainUser" + Math.random()
const passwd: string = "avalancheJsP@ssw4rd"

// private keys
const adminPrivateKey =
  "PrivateKey-vmRQiZeXEXYMyJhEiqdC2z5JhuDbxL8ix9UVvjgMu2Er1NepE"
const gasFeeAddrPrivateKey =
  "PrivateKey-Ge71NJhUY3TjZ9dLohijSnNq46QxobjqxHGMUDAPoVsNFA93w"
const kycAddrPrivateKey =
  "PrivateKey-ewoqjP7PxY4yr3iLTpLisriqt94hdyDFNgchSxGGztUrTXtNN"

// c private keys
const adminCPrivateKey =
  "7a14fdf6bb1d53e28384f70209280dd8848bdc96b5f9eb7fdde9fcddc7ef1a0d"
const gasFeeAddrCPrivateKey =
  "23830b3225cb76144fa3c12ccb7ff387f11e2feedbb0ec009b2121f3f8b80c52"
const kycPrivateKey =
  "56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027"
const node6PrivateKey =
  "PrivateKey-UfV3iPVP8ThZuSXmUacsahdzePs5VkXct4XoQKsW9mffN1d8J"
const node7PrivateKey =
  "PrivateKey-2DXzE36hZ3MSKxk1Un5mBHGwcV69CqkKvbVvSwFBhDRtnbFCDX"
const signerAddrPrivateKey =
  "PrivateKey-2Vtf2ZhTRz6WcVcSH7cS7ghKneZxZ2L5W8assdCcaNDVdpoYfY"
const signer2AddrPrivateKey =
  "PrivateKey-XQFgPzByKfqFfpVTafmZHBqfaw4hsDTGbbcArUg4unMiEKvrD"

const node6Id = "NodeID-FHseEbTVS7U3odWfjgZYyygsv5gWCqVdk"
// x addresses
const adminAddress = "X-kopernikus1g65uqn6t77p656w64023nh8nd9updzmxh8ttv3"

// contract addresses
const contractAddr = "0x010000000000000000000000000000000000000a"

// c addresses
const adminAddr: string = "0x1f0e5c64afdf53175f78846f7125776e76fa8f34"

const kycAddr: string = "0x8db97c7cece249c2b98bdc0226cc4c2a57bf52fc"

const gasFeeXAddr = "X-kopernikus13kyf72ftu4l77kss7xm0kshm0au29s48zjaygq"
const gasFeeAddr: string = "0x305cea207112c0561033133f816d7a2233699f06"

const ownerPAddr = "P-kopernikus1jla8ty5c9ud6lsj8s4re2dvzvfxpzrxdcrd8q7"
const ownerCAddr = "0x3187aFA01C28A200Bf27F605E2753E8d9CcBe0e1"

const multiSigAliasPAddr = "P-kopernikus1fwrv3kj5jqntuucw67lzgu9a9tkqyczxgcvpst"

const blacklistAddr: string = "0x7f28dcdfc67af590918c271226034058fd15e868"

const dummyContractBin =
  "0x60806040523480156100115760006000fd5b50610017565b61016e806100266000396000f3fe60806040523480156100115760006000fd5b506004361061005c5760003560e01c806350f6fe3414610062578063aa8b1d301461006c578063b9b046f914610076578063d8b9839114610080578063e09fface1461008a5761005c565b60006000fd5b61006a610094565b005b6100746100ad565b005b61007e6100b5565b005b6100886100c2565b005b610092610135565b005b6000600090505b5b808060010191505061009b565b505b565b60006000fd5b565b600015156100bf57fe5b5b565b6040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252600d8152602001807f72657665727420726561736f6e0000000000000000000000000000000000000081526020015060200191505060405180910390fd5b565b5b56fea2646970667358221220345bbcbb1a5ecf22b53a78eaebf95f8ee0eceff6d10d4b9643495084d2ec934a64736f6c63430006040033"

let keystore: KeystoreAPI
let contract: any
let xChain: avm.AVMAPI
let pChain: PlatformVMAPI
let cChain: EVMAPI
let cAddresses, pAddresses: Buffer[]
let cAddressStrings, pAddressStrings: string[]
let tx = { value: "" }

beforeAll(async () => {
  await avalanche.fetchNetworkSettings()
  keystore = new KeystoreAPI(avalanche)
  const Web3 = require("web3")
  const fs = require("fs")
  const path = require("path")

  const configFile = fs.readFileSync(
    path.join(__dirname, "common", "caminoConfig.json")
  )
  const config = JSON.parse(configFile)
  const rpcUrl = `${config.protocol}://${config.host}:${config.port}/ext/bc/C/rpc`
  const web3 = new Web3(rpcUrl, null, { transactionConfirmationBlocks: 1 }) //s

  const abiFile = fs.readFileSync(path.join(__dirname, "abi/CaminoAdmin.abi"))
  const ABI = JSON.parse(abiFile.toString())

  contract = new web3.eth.Contract(ABI, contractAddr) // ABI is the compiled smart contract ABI

  const adminAccount = web3.eth.accounts.privateKeyToAccount(adminCPrivateKey)
  web3.eth.accounts.wallet.add(adminAccount)

  const gasFeeAccount = web3.eth.accounts.privateKeyToAccount(
    gasFeeAddrCPrivateKey
  )
  web3.eth.accounts.wallet.add(gasFeeAccount)

  const kycAccount = web3.eth.accounts.privateKeyToAccount(kycPrivateKey)
  web3.eth.accounts.wallet.add(kycAccount)

  cChain = avalanche.CChain()
  xChain = avalanche.XChain()
  pChain = avalanche.PChain()
  xChain.keyChain().importKey(adminPrivateKey)
  xChain.keyChain().importKey(gasFeeAddrPrivateKey)
  xChain.keyChain().importKey(kycAddrPrivateKey)

  pChain.keyChain().importKey(adminPrivateKey)
  pChain.keyChain().importKey(gasFeeAddrPrivateKey)
  pChain.keyChain().importKey(kycAddrPrivateKey)
  pChain.keyChain().importKey(signerAddrPrivateKey)
  pChain.keyChain().importKey(signer2AddrPrivateKey)
  pAddresses = pChain.keyChain().getAddresses()
  pAddressStrings = pChain.keyChain().getAddressStrings()

  cChain.keyChain().importKey(adminPrivateKey)
  cChain.keyChain().importKey(gasFeeAddrPrivateKey)
  cChain.keyChain().importKey(kycAddrPrivateKey)

  cChain.keyChain().importKey(node6PrivateKey)
  cChain.keyChain().importKey(node7PrivateKey)
  cChain.keyChain().importKey(signerAddrPrivateKey)
  cChain.keyChain().importKey(signer2AddrPrivateKey)

  cAddresses = cChain.keyChain().getAddresses()
  cAddressStrings = cChain.keyChain().getAddressStrings()
})

describe("Camino-CChain-Admin-Role", (): void => {
  const dummyContractBin =
    "0x60806040523480156100115760006000fd5b50610017565b61016e806100266000396000f3fe60806040523480156100115760006000fd5b506004361061005c5760003560e01c806350f6fe3414610062578063aa8b1d301461006c578063b9b046f914610076578063d8b9839114610080578063e09fface1461008a5761005c565b60006000fd5b61006a610094565b005b6100746100ad565b005b61007e6100b5565b005b6100886100c2565b005b610092610135565b005b6000600090505b5b808060010191505061009b565b505b565b60006000fd5b565b600015156100bf57fe5b5b565b6040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252600d8152602001807f72657665727420726561736f6e0000000000000000000000000000000000000081526020015060200191505060405180910390fd5b565b5b56fea2646970667358221220345bbcbb1a5ecf22b53a78eaebf95f8ee0eceff6d10d4b9643495084d2ec934a64736f6c63430006040033"

  const tests_spec: any = [
    // Initial Role Check
    [
      "adminAddress role check",
      () =>
        contract.methods
          .hasRole(adminAddr, EVMCaminoConstants.ADMINROLE)
          .call(),
      (x) => x,
      Matcher.toEqual,
      () => true
    ],
    [
      "gasFeeAddr role check",
      () =>
        contract.methods
          .hasRole(gasFeeAddr, EVMCaminoConstants.GASFEEROLE)
          .call(),
      (x) => x,
      Matcher.toEqual,
      () => false
    ],
    [
      "kycAddr role check",
      () =>
        contract.methods.hasRole(kycAddr, EVMCaminoConstants.KYCROLE).call(),
      (x) => x,
      Matcher.toEqual,
      () => false
    ],
    [
      "blacklistAddr role check",
      () =>
        contract.methods
          .hasRole(blacklistAddr, EVMCaminoConstants.BLACKLISTROLE)
          .call(),
      (x) => x,
      Matcher.toEqual,
      () => false
    ],
    // Send Tokens to gasFeeAddr
    [
      "createUser",
      () => keystore.createUser(user, passwd),
      (x) => x,
      Matcher.toEqual,
      () => {
        return {}
      }
    ],
    [
      "importKey of user",
      () => xChain.importKey(user, passwd, adminPrivateKey),
      (x) => x,
      Matcher.toBe,
      () => adminAddress
    ],
    [
      "send tokens to gas fee address",
      () =>
        xChain.send(
          user,
          passwd,
          "CAM",
          900000000000,
          gasFeeXAddr,
          [adminAddress],
          adminAddress,
          "memo"
        ),
      (x) => x.txID,
      Matcher.Get,
      () => tx,
      3000
    ],
    [
      "export X->C gas fee address",
      () =>
        (async function () {
          const avmUTXOResponse: GetUTXOsResponse = await xChain.getUTXOs(
            gasFeeXAddr
          )
          const utxoSet: avm.UTXOSet = avmUTXOResponse.utxos

          const unsignedTx: avm.UnsignedTx = await xChain.buildExportTx(
            utxoSet,
            new BN(800000000000),
            avalanche.getNetwork().C.blockchainID,
            [cAddressStrings[1]],
            [gasFeeXAddr],
            [gasFeeXAddr]
          )

          const tx: avm.Tx = unsignedTx.sign(xChain.keyChain())
          return xChain.issueTx(tx)
        })(),
      (x) => x,
      Matcher.Get,
      () => tx,
      3000
    ],
    [
      "import X->C gas fee address",
      () =>
        (async function () {
          const baseFeeResponse: string = await cChain.getBaseFee()
          const baseFee = new BN(parseInt(baseFeeResponse, 16) / 1e9)
          const evmUTXOResponse: any = await cChain.getUTXOs(
            cAddressStrings,
            avalanche.getNetwork().X.blockchainID
          )
          const utxoSet: UTXOSet = evmUTXOResponse.utxos

          let unsignedTx: UnsignedTx = await cChain.buildImportTx(
            utxoSet,
            gasFeeAddr,
            [cAddressStrings[1]],
            avalanche.getNetwork().X.blockchainID,
            cChain.getDefaultTxFee()
          )
          const importCost: number = costImportTx(
            avalanche.getNetwork().C,
            unsignedTx
          )
          const fee = baseFee.mul(new BN(importCost))

          unsignedTx = await cChain.buildImportTx(
            utxoSet,
            gasFeeAddr,
            [cAddressStrings[1]],
            avalanche.getNetwork().X.blockchainID,
            fee
          )

          const tx: Tx = unsignedTx.sign(cChain.keyChain())
          return cChain.issueTx(tx)
        })(),
      (x) => x,
      Matcher.Get,
      () => tx,
      3000
    ],
    [
      "verify import tx has been committed",
      () => cChain.getAtomicTxStatus(tx.value),
      (x) => x,
      Matcher.toBe,
      () => "Accepted",
      3000
    ],
    // Role Addition
    [
      "grant gas fee role to gasFeeAddr",
      () =>
        contract.methods
          .grantRole(gasFeeAddr, EVMCaminoConstants.GASFEEROLE)
          .send({ from: adminAddr, gas: 1000000 }),
      (x) => x.events.SetRole.returnValues.role,
      Matcher.toBe,
      () => EVMCaminoConstants.GASFEEROLE.toString()
    ],
    [
      "grant kyc role to kycAddr",
      () =>
        contract.methods
          .grantRole(kycAddr, EVMCaminoConstants.KYCROLE)
          .send({ from: adminAddr, gas: 1000000 }),
      (x) => x.events.SetRole.returnValues.role,
      Matcher.toBe,
      () => EVMCaminoConstants.KYCROLE.toString()
    ],
    [
      "grant blacklist role to blacklistAddr",
      () =>
        contract.methods
          .grantRole(blacklistAddr, EVMCaminoConstants.BLACKLISTROLE)
          .send({ from: adminAddr, gas: 1000000 }),
      (x) => x.events.SetRole.returnValues.role,
      Matcher.toBe,
      () => EVMCaminoConstants.BLACKLISTROLE.toString()
    ],
    // Role Validation
    [
      "adminAddress role validation",
      () => contract.methods.getRoles(adminAddr).call(),
      (x) => x,
      Matcher.toBe,
      () => EVMCaminoConstants.ADMINROLE.toString()
    ],
    [
      "gasFeeAddr role validation",
      () => contract.methods.getRoles(gasFeeAddr).call(),
      (x) => x,
      Matcher.toBe,
      () => EVMCaminoConstants.GASFEEROLE.toString()
    ],
    [
      "kycAddr role validation",
      () => contract.methods.getRoles(kycAddr).call(),
      (x) => x,
      Matcher.toBe,
      () => EVMCaminoConstants.KYCROLE.toString()
    ],
    [
      "blacklistAddr role validation",
      () => contract.methods.getRoles(blacklistAddr).call(),
      (x) => x,
      Matcher.toBe,
      () => EVMCaminoConstants.BLACKLISTROLE.toString()
    ],
    // Role Removal
    [
      "revoke gas fee role from gasFeeAddr",
      () =>
        contract.methods
          .revokeRole(gasFeeAddr, EVMCaminoConstants.GASFEEROLE)
          .send({ from: adminAddr, gas: 1000000 }),
      (x) => x.events.DropRole.returnValues.role,
      Matcher.toBe,
      () => EVMCaminoConstants.GASFEEROLE.toString()
    ],
    [
      "revoke kyc role from kycAddr",
      () =>
        contract.methods
          .revokeRole(kycAddr, EVMCaminoConstants.KYCROLE)
          .send({ from: adminAddr, gas: 1000000 }),
      (x) => x.events.DropRole.returnValues.role,
      Matcher.toBe,
      () => EVMCaminoConstants.KYCROLE.toString()
    ],
    [
      "revoke blacklist role from blacklistAddr",
      () =>
        contract.methods
          .revokeRole(blacklistAddr, EVMCaminoConstants.BLACKLISTROLE)
          .send({ from: adminAddr, gas: 1000000 }),
      (x) => x.events.DropRole.returnValues.role,
      Matcher.toBe,
      () => EVMCaminoConstants.BLACKLISTROLE.toString()
    ],
    [
      "gasFeeAddr role validation",
      () => contract.methods.getRoles(gasFeeAddr).call(),
      (x) => x,
      Matcher.toBe,
      () => "0"
    ],
    // Invalid Calls
    [
      "gas fee address tries to give role to itself",
      () =>
        contract.methods
          .grantRole(gasFeeAddr, EVMCaminoConstants.ADMINROLE)
          .send({ from: gasFeeAddr, gas: 1000000 }),
      (x) => x,
      Matcher.toThrow,
      () => "Transaction has been reverted by the EVM"
    ],
    [
      "gas fee address tries to give role to kycAddr",
      () =>
        contract.methods
          .grantRole(kycAddr, EVMCaminoConstants.GASFEEROLE)
          .send({ from: gasFeeAddr, gas: 1000000 }),
      (x) => x,
      Matcher.toThrow,
      () => "Transaction has been reverted by the EVM"
    ],
    // Role Validation
    [
      "gasFeeAddr role validation",
      () => contract.methods.getRoles(gasFeeAddr).call(),
      (x) => x,
      Matcher.toBe,
      () => "0"
    ],
    [
      "kycAddr role validation",
      () => contract.methods.getRoles(kycAddr).call(),
      (x) => x,
      Matcher.toBe,
      () => "0"
    ],
    [
      "blacklistAddr role validation",
      () => contract.methods.getRoles(blacklistAddr).call(),
      (x) => x,
      Matcher.toBe,
      () => "0"
    ],
    [
      "grant kyc role to adminAddr",
      () =>
        contract.methods
          .grantRole(adminAddr, EVMCaminoConstants.KYCROLE)
          .send({ from: adminAddr, gas: 1000000 }),
      (x) => x.events.SetRole.returnValues.role,
      Matcher.toBe,
      () => EVMCaminoConstants.KYCROLE.toString()
    ],
    [
      "ApplyKycState with KYC Role to adminAddr",
      () =>
        contract.methods
          .applyKycState(
            adminAddr,
            false,
            BigInt(EVMCaminoConstants.KYC_APPROVED)
          )
          .send({ from: adminAddr, gas: 1000000 }),
      (x) => x.events.KycStateChanged.returnValues.newState,
      Matcher.toBe,
      () => EVMCaminoConstants.KYC_APPROVED.toString()
    ],
    [
      "GetKycState from kycAddr",
      () => contract.methods.getKycState(adminAddr).call(),
      (x) => x,
      Matcher.toBe,
      () => EVMCaminoConstants.ADMINROLE.toString()
    ],
    [
      "SC deployment",
      async function () {
        try {
          const response: any = await contract
            .deploy({ data: dummyContractBin })
            .send({ from: adminAddr, gas: 1000000 })

          if (response.options.address == null) {
            throw "Contract was not deployed"
          } else {
            throw "Contract was deployed"
          }
        } catch (e) {
          return e
        }
      },
      (x) => x,
      Matcher.toBe,
      () => "Contract was deployed"
    ],
    [
      "ApplyKycState with KYC Role to adminAddr (remove)",
      () =>
        contract.methods
          .applyKycState(
            adminAddr,
            true,
            BigInt(EVMCaminoConstants.KYC_APPROVED)
          )
          .send({ from: adminAddr, gas: 1000000 }),
      (x) => x.events.KycStateChanged.returnValues.newState,
      Matcher.toBe,
      () => "0"
    ],
    [
      "GetKycState from kycAddr",
      () => contract.methods.getKycState(adminAddr).call(),
      (x) => x,
      Matcher.toBe,
      () => "0"
    ],
    [
      "revoke kyc role from adminAddr",
      () =>
        contract.methods
          .revokeRole(adminAddr, EVMCaminoConstants.KYCROLE)
          .send({ from: adminAddr, gas: 1000000 }),
      (x) => x.events.DropRole.returnValues.role,
      Matcher.toBe,
      () => EVMCaminoConstants.KYCROLE.toString()
    ],
    [
      "adminAddr role validation",
      () => contract.methods.getRoles(adminAddr).call(),
      (x) => x,
      Matcher.toBe,
      () => "1"
    ]
  ]

  createTests(tests_spec)
})

describe("Camino-CChain-Gas-Fee-Role", (): void => {
  const tests_spec: any = [
    // Initial Role Check
    [
      "adminAddress role check",
      () =>
        contract.methods
          .hasRole(adminAddr, EVMCaminoConstants.ADMINROLE)
          .call(),
      (x) => x,
      Matcher.toEqual,
      () => true
    ],
    [
      "gasFeeAddr role check",
      () =>
        contract.methods
          .hasRole(gasFeeAddr, EVMCaminoConstants.GASFEEROLE)
          .call(),
      (x) => x,
      Matcher.toEqual,
      () => false
    ],
    // Role Addition
    [
      "grant gas fee role to gasFeeAddr",
      () =>
        contract.methods
          .grantRole(gasFeeAddr, EVMCaminoConstants.GASFEEROLE)
          .send({ from: adminAddr, gas: 1000000 }),
      (x) => x.events.SetRole.returnValues.role,
      Matcher.Get,
      () => tx
    ],
    // Role Validation
    [
      "gasFeeAddr role validation",
      () => contract.methods.getRoles(gasFeeAddr).call(),
      (x) => x,
      Matcher.toBe,
      () => EVMCaminoConstants.GASFEEROLE.toString()
    ],
    // Base Fee
    [
      "get initial base fee",
      () => contract.methods.getBaseFee().call(),
      (x) => x,
      Matcher.toBe,
      () => "0"
    ],
    [
      "set base fee",
      () =>
        contract.methods.setBaseFee(5).send({ from: gasFeeAddr, gas: 1000000 }),
      (x) => x.events.GasFeeSet.returnValues.newGasFee,
      Matcher.toBe,
      () => "5"
    ],
    [
      "get modified base fee",
      () => contract.methods.getBaseFee().call(),
      (x) => x,
      Matcher.toBe,
      () => "5"
    ],
    [
      "set base fee with the new gas price",
      () =>
        contract.methods
          .setBaseFee(50)
          .send({ from: gasFeeAddr, gas: 1000000, gasPrice: 5 }),
      (x) => x.events.GasFeeSet.returnValues.newGasFee,
      Matcher.toBe,
      () => "50"
    ],
    [
      "get modified base fee",
      () => contract.methods.getBaseFee().call(),
      (x) => x,
      Matcher.toBe,
      () => "50"
    ],
    [
      "set base fee with the new gas price (Fail)",
      () =>
        contract.methods
          .setBaseFee(50)
          .send({ from: gasFeeAddr, gas: 1000000, gasPrice: 5 }),
      (x) => x,
      Matcher.toThrow,
      () => "transaction underpriced"
    ],
    // Role Removal
    [
      "revoke gas fee role",
      () =>
        contract.methods
          .revokeRole(gasFeeAddr, EVMCaminoConstants.GASFEEROLE)
          .send({ from: adminAddr, gas: 1000000 }),
      (x) => x.events.DropRole.returnValues.role,
      Matcher.toBe,
      () => EVMCaminoConstants.GASFEEROLE.toString()
    ]
  ]

  createTests(tests_spec)
})

describe("Camino-CChain-KYC-Role", (): void => {
  const tests_spec: any = [
    // Initial Role Check
    [
      "adminAddress role check",
      () =>
        contract.methods
          .hasRole(adminAddr, EVMCaminoConstants.ADMINROLE)
          .call(),
      (x) => x,
      Matcher.toEqual,
      () => true
    ],
    [
      "kycAddr role check",
      () =>
        contract.methods.hasRole(kycAddr, EVMCaminoConstants.KYCROLE).call(),
      (x) => x,
      Matcher.toEqual,
      () => false
    ],
    // Role Addition
    [
      "grant kyc role to kycAddr",
      () =>
        contract.methods
          .grantRole(kycAddr, EVMCaminoConstants.KYCROLE)
          .send({ from: adminAddr, gas: 1000000 }),
      (x) => x.events.SetRole.returnValues.role,
      Matcher.toBe,
      () => EVMCaminoConstants.KYCROLE.toString()
    ],
    //   KYC State
    [
      "getKycState check",
      () => contract.methods.getKycState(kycAddr).call(),
      (x) => x,
      Matcher.toBe,
      () => "0"
    ],
    [
      "applyKycState addition",
      () =>
        contract.methods
          .applyKycState(kycAddr, false, EVMCaminoConstants.KYC_APPROVED)
          .send({ from: kycAddr, gas: 1000000 }),
      (x) => x.events.KycStateChanged.returnValues.newState,
      Matcher.toBe,
      () => EVMCaminoConstants.KYC_APPROVED.toString()
    ],
    [
      "getKycState validation",
      () => contract.methods.getKycState(kycAddr).call(),
      (x) => x,
      Matcher.toBe,
      () => EVMCaminoConstants.KYC_APPROVED.toString()
    ],
    [
      "SC deployment with KYC_APPROVED State",
      async function () {
        try {
          const response: any = await contract
            .deploy({ data: dummyContractBin })
            .send({ from: kycAddr, gas: 1000000 })

          if (response.options.address == null) {
            throw "Contract was not deployed"
          } else {
            throw "Contract was deployed"
          }
        } catch (e) {
          return e
        }
      },
      (x) => x,
      Matcher.toBe,
      () => "Contract was deployed"
    ],
    [
      "applyKycState expiration",
      () =>
        contract.methods
          .applyKycState(kycAddr, false, EVMCaminoConstants.KYC_EXPIRED)
          .send({ from: kycAddr, gas: 1000000 }),
      (x) => x.events.KycStateChanged.returnValues.newState,
      Matcher.toBe,
      () => EVMCaminoConstants.KYC_APPROVED.toString()
    ],
    [
      "getKycState validation",
      () => contract.methods.getKycState(kycAddr).call(),
      (x) => x,
      Matcher.toBe,
      () => EVMCaminoConstants.KYC_APPROVED.toString()
    ],
    [
      "SC deployment with KYC_EXPIRED State",
      async function () {
        try {
          const response: any = await contract
            .deploy({ data: dummyContractBin })
            .send({ from: kycAddr, gas: 1000000 })

          if (response.options.address == null) {
            throw "Contract was not deployed"
          } else {
            throw "Contract was deployed"
          }
        } catch (e) {
          return e
        }
      },
      (x) => x,
      Matcher.toBe,
      () => "Contract was deployed"
    ],
    [
      "applyKycState addition",
      () =>
        contract.methods
          .applyKycState(kycAddr, false, EVMCaminoConstants.KYC_APPROVED)
          .send({ from: kycAddr, gas: 1000000 }),
      (x) => x.events.KycStateChanged.returnValues.newState,
      Matcher.toBe,
      () => EVMCaminoConstants.KYC_APPROVED.toString()
    ],
    [
      "getKycState validation",
      () => contract.methods.getKycState(kycAddr).call(),
      (x) => x,
      Matcher.toBe,
      () => EVMCaminoConstants.KYC_APPROVED.toString()
    ],
    [
      "applyKycState removal",
      () =>
        contract.methods
          .applyKycState(kycAddr, true, EVMCaminoConstants.KYC_APPROVED)
          .send({ from: kycAddr, gas: 1000000 }),
      (x) => x.events.KycStateChanged.returnValues.newState,
      Matcher.toBe,
      () => "0"
    ],
    [
      "getKycState removal validation",
      () => contract.methods.getKycState(kycAddr).call(),
      (x) => x,
      Matcher.toBe,
      () => "0"
    ],
    [
      "SC deployment with No State",
      () =>
        contract
          .deploy({ data: dummyContractBin })
          .send({ from: kycAddr, gas: 1000000 }),
      (x) => x,
      Matcher.toThrow,
      () => "The contract code couldn't be stored, please check your gas limit."
    ],
    // Role Removal
    [
      "revoke kyc role",
      () =>
        contract.methods
          .revokeRole(kycAddr, EVMCaminoConstants.KYCROLE)
          .send({ from: adminAddr, gas: 1000000 }),
      (x) => x.events.DropRole.returnValues.role,
      Matcher.toBe,
      () => EVMCaminoConstants.KYCROLE.toString()
    ],
    // Invalid Transaction
    [
      "applyKycState addition",
      () =>
        contract.methods
          .applyKycState(kycAddr, false, EVMCaminoConstants.KYC_APPROVED)
          .send({ from: adminAddr, gas: 1000000 }),
      (x) => x,
      Matcher.toThrow,
      () => "Transaction has been reverted by the EVM"
    ],
    [
      "getKycState removal validation",
      () => contract.methods.getKycState(kycAddr).call(),
      (x) => x,
      Matcher.toBe,
      () => "0"
    ]
  ]

  createTests(tests_spec)
})
describe("Camino-CChain-Prepare-Validator-Rewards", (): void => {
  const tests_spec: any = [
    [
      "Grant kyc role to adminAddr",
      () =>
        (async function () {
          const hasKycRole = await contract.methods
            .hasRole(adminAddr, EVMCaminoConstants.KYCROLE)
            .call()
          if (hasKycRole) {
            return Promise.resolve(true)
          }
          const response = await contract.methods
            .grantRole(adminAddr, EVMCaminoConstants.KYCROLE)
            .send({ from: adminAddr, gas: 1000000 })

          return Promise.resolve(
            Number(response.events.SetRole.returnValues.role) >=
              EVMCaminoConstants.KYCROLE
          )
        })(),
      (x) => x,
      Matcher.toBe,
      () => true
    ],
    [
      "ApplyKycState with KYC Role to adminAddr",
      () =>
        contract.methods
          .applyKycState(
            adminAddr,
            false,
            BigInt(EVMCaminoConstants.KYC_APPROVED)
          )
          .send({ from: adminAddr, gas: 1000000 }),
      (x) => x.events.KycStateChanged.returnValues.newState,
      Matcher.toBe,
      () => String(EVMCaminoConstants.KYC_APPROVED)
    ],
    [
      "Trigger txs on cchain to accumulate gas fees as rewards",
      () =>
        (async function () {
          for (let i = 0; i < 3; i++) {
            await contract
              .deploy({ data: dummyContractBin })
              .send({ from: adminAddr, gas: 1000000 })
            await new Promise((res) => setTimeout(res, 1000))
          }
          return Promise.resolve("done")
        })(),
      (x) => x,
      Matcher.toBe,
      () => "done"
    ],
    [
      "Trigger another sc deployment after the feeRewardExportMinTimeInterval has passed",
      () =>
        contract
          .deploy({ data: dummyContractBin })
          .send({ from: adminAddr, gas: 1000000 }),
      (x) => x.options.address != null,
      Matcher.toBe,
      () => true,
      60000 // wait 1 minute [feeRewardExportMinTimeInterval] before re-issuing a cchain tx
    ]
  ]

  createTests(tests_spec)
})

// Important: Please note that the following test scenario should run last as it will remove the adminAddr's admin role which
// will prevent the other test cases from running such as granting roles on behalf of the adminAddr
describe("Camino-CChain-Multi-Role", (): void => {
  const tests_spec: any = [
    // Initial Role Check
    [
      "adminAddress role check",
      () =>
        contract.methods
          .hasRole(adminAddr, EVMCaminoConstants.ADMINROLE)
          .call(),
      (x) => x,
      Matcher.toEqual,
      () => true
    ],
    // Role Addition
    [
      "grant gas fee role to adminAddr",
      () =>
        contract.methods
          .grantRole(adminAddr, EVMCaminoConstants.GASFEEROLE)
          .send({ from: adminAddr, gas: 1000000 }),
      (x) => x.events.SetRole.returnValues.role,
      Matcher.toBe,
      () => EVMCaminoConstants.GASFEEROLE.toString()
    ],
    [
      "grant kyc role to adminAddr",
      () =>
        contract.methods
          .grantRole(adminAddr, EVMCaminoConstants.KYCROLE)
          .send({ from: adminAddr, gas: 1000000 }),
      (x) => x.events.SetRole.returnValues.role,
      Matcher.toBe,
      () => EVMCaminoConstants.KYCROLE.toString()
    ],
    // Role Validation
    [
      "adminAddr role validation",
      () => contract.methods.getRoles(adminAddr).call(),
      (x) => x,
      Matcher.toBe,
      () =>
        (
          EVMCaminoConstants.ADMINROLE +
          EVMCaminoConstants.GASFEEROLE +
          EVMCaminoConstants.KYCROLE
        ).toString()
    ],
    [
      "setBaseFee with Gas Fee Role",
      () =>
        contract.methods
          .setBaseFee(BigInt(10))
          .send({ from: adminAddr, gas: 1000000 }),
      (x) => x.events.GasFeeSet.returnValues.newGasFee,
      Matcher.toBe,
      () => "10"
    ],
    [
      "getBaseFee",
      () => contract.methods.getBaseFee().call(),
      (x) => x,
      Matcher.toBe,
      () => "10"
    ],
    [
      "revoke gas fee role from adminAddr",
      () =>
        contract.methods
          .revokeRole(adminAddr, EVMCaminoConstants.GASFEEROLE)
          .send({ from: adminAddr, gas: 1000000 }),
      (x) => x.events.DropRole.returnValues.role,
      Matcher.toBe,
      () => EVMCaminoConstants.GASFEEROLE.toString()
    ],
    // Role Validation
    [
      "adminAddr role validation after revoke",
      () => contract.methods.getRoles(adminAddr).call(),
      (x) => x,
      Matcher.toBe,
      () =>
        (EVMCaminoConstants.ADMINROLE + EVMCaminoConstants.KYCROLE).toString()
    ],
    [
      "setBaseFee without Gas Fee Role",
      () =>
        contract.methods
          .setBaseFee(BigInt(100))
          .send({ from: adminAddr, gas: 1000000 }),
      (x) => x,
      Matcher.toThrow,
      () => "Transaction has been reverted by the EVM"
    ],
    [
      "getBaseFee",
      () => contract.methods.getBaseFee().call(),
      (x) => x,
      Matcher.toBe,
      () => "10"
    ],
    //   Admin state (and not KYC) is needed to deploy a contract
    [
      "ApplyKycState with KYC Role to adminAddr",
      () =>
        contract.methods
          .applyKycState(adminAddr, false, BigInt(1))
          .send({ from: adminAddr, gas: 1000000 }),
      (x) => x.events.KycStateChanged.returnValues.newState,
      Matcher.toBe,
      () => "1"
    ],
    [
      "GetKycState from kycAddr",
      () => contract.methods.getKycState(adminAddr).call(),
      (x) => x,
      Matcher.toBe,
      () => EVMCaminoConstants.ADMINROLE.toString()
    ],
    [
      "SC deployment from adminAddr (Successfully)",
      async function () {
        try {
          const response: any = await contract
            .deploy({ data: dummyContractBin })
            .send({ from: adminAddr, gas: 1000000 })

          if (response.options.address == null) {
            throw "Contract was not deployed"
          } else {
            throw "Contract was deployed"
          }
        } catch (e) {
          return e
        }
      },
      (x) => x,
      Matcher.toBe,
      () => "Contract was deployed"
    ],
    [
      "ApplyKycState with KYC Role to kycAddr (remove)",
      () =>
        contract.methods
          .applyKycState(adminAddr, true, BigInt(EVMCaminoConstants.ADMINROLE))
          .send({ from: adminAddr, gas: 1000000 }),
      (x) => x.events.KycStateChanged.returnValues.newState,
      Matcher.toBe,
      () => "0"
    ],
    [
      "GetKycState from adminAddr",
      () => contract.methods.getKycState(adminAddr).call(),
      (x) => x,
      Matcher.toBe,
      () => "0"
    ],
    //   Failed deployment throws a quite misleading error
    [
      "SC deployment from adminAddr (Not Successfully)",
      () =>
        contract
          .deploy({ data: dummyContractBin })
          .send({ from: adminAddr, gas: 1000000 }),
      (x) => x,
      Matcher.toThrow,
      () => "The contract code couldn't be stored, please check your gas limit."
    ],
    [
      "revoke KYC role from adminAddr",
      () =>
        contract.methods
          .revokeRole(adminAddr, EVMCaminoConstants.KYCROLE)
          .send({ from: adminAddr, gas: 1000000 }),
      (x) => x.events.DropRole.returnValues.role,
      Matcher.toBe,
      () => EVMCaminoConstants.KYCROLE.toString()
    ],
    // Role Validation
    [
      "adminAddr role validation",
      () => contract.methods.getRoles(adminAddr).call(),
      (x) => x,
      Matcher.toBe,
      () => EVMCaminoConstants.ADMINROLE.toString()
    ],
    //   Cannot call applyKycState without KYC role
    [
      "ApplyKycState without KYC Role to adminAddr",
      () =>
        contract.methods
          .applyKycState(adminAddr, false, BigInt(1))
          .send({ from: adminAddr, gas: 1000000 }),
      (x) => x,
      Matcher.toThrow,
      () => "Transaction has been reverted by the EVM"
    ],
    [
      "GetKycState from adminAddr",
      () => contract.methods.getKycState(adminAddr).call(),
      (x) => x,
      Matcher.toBe,
      () => "0"
    ],
    [
      "revoke admin role",
      () =>
        contract.methods
          .revokeRole(adminAddr, EVMCaminoConstants.ADMINROLE)
          .send({ from: adminAddr, gas: 1000000 }),
      (x) => x.events.DropRole.returnValues.role,
      Matcher.toBe,
      () => EVMCaminoConstants.ADMINROLE.toString()
    ],
    // Role Validation
    [
      "adminAddr role validation",
      () => contract.methods.getRoles(adminAddr).call(),
      (x) => x,
      Matcher.toBe,
      () => "0"
    ],
    [
      "grant admin role to adminAddr without having admin rights",
      () =>
        contract.methods
          .grantRole(adminAddr, EVMCaminoConstants.ADMINROLE)
          .send({ from: adminAddr, gas: 1000000 }),
      (x) => x,
      Matcher.toThrow,
      () => "Transaction has been reverted by the EVM"
    ]
  ]
  createTests(tests_spec)
})

describe("Camino-CChain-Multisig", (): void => {
  const tests_spec: any = [
    [
      "export P->C with recipient",
      () =>
        (async function () {
          const msigAliasBuffer = pChain.parseAddress(multiSigAliasPAddr)
          const owner = await pChain.getMultisigAlias(multiSigAliasPAddr)
          const platformVMUTXOResponse: any = await pChain.getUTXOs([
            ownerPAddr
          ])
          const utxoSet: PlatformUTXOSet = platformVMUTXOResponse.utxos

          const pUnsignedTx: PlatformUnsignedTx = await pChain.buildExportTx(
            utxoSet,
            new BN(2246001),
            cChain.getBlockchainID(),
            [pAddressStrings[2], pAddressStrings[3]],
            [ownerPAddr],
            [ownerPAddr],
            undefined,
            new BN(0),
            owner.locktime,
            owner.threshold,
            owner.threshold
          )

          const txbuff = pUnsignedTx.toBuffer()
          const msg: Buffer = Buffer.from(
            createHash("sha256").update(txbuff).digest()
          )

          const msKeyChain = createMsigKCAndAddSignatures(
            [pAddresses[2], pAddresses[3]],
            msg,
            msigAliasBuffer,
            owner,
            pUnsignedTx,
            "P"
          )
          const tx: PlatformTx = pUnsignedTx.sign(msKeyChain)
          return pChain.issueTx(tx)
        })(),
      (x) => x,
      Matcher.Get,
      () => tx,
      3000
    ],
    [
      "import P->C with recipient",
      () =>
        (async function () {
          const msigAliasBuffer = pChain.parseAddress(multiSigAliasPAddr)
          const baseFeeResponse: string =
            cChain.getBaseFee()[Symbol.toStringTag]
          const baseFee = new BN(parseInt(baseFeeResponse, 16) / 1e9)
          const owner = await pChain.getMultisigAlias(multiSigAliasPAddr)
          let fee: BN

          const evmUTXOResponse: any = await cChain.getUTXOs(
            cAddressStrings,
            pChain.getBlockchainID(),
            0,
            undefined
          )
          const utxoSet: UTXOSet = evmUTXOResponse.utxos

          let unsignedTx: UnsignedTx = await cChain.buildImportTx(
            utxoSet,
            ownerCAddr,
            [cAddressStrings[6], cAddressStrings[5]],
            pChain.getBlockchainID().toString(),
            new BN(0)
          )
          const importCost: number = costImportTx(
            avalanche.getNetwork().C,
            unsignedTx
          )

          if (baseFee > new BN(0)) {
            fee = baseFee.mul(new BN(importCost))
          } else {
            fee = new BN(2246000)
          }

          unsignedTx = await cChain.buildImportTx(
            utxoSet,
            ownerCAddr,
            [cAddressStrings[6], cAddressStrings[5]],
            avalanche.getNetwork().P.blockchainID,
            new BN(fee)
          )

          const txbuff = unsignedTx.toBuffer()
          const msg: Buffer = Buffer.from(
            createHash("sha256").update(txbuff).digest()
          )

          const msKeyChain = createMsigKCAndAddSignatures(
            [cAddresses[6], cAddresses[5]],
            msg,
            msigAliasBuffer,
            owner,
            unsignedTx,
            "C"
          )
          const tx: Tx = unsignedTx.sign(msKeyChain)
          return cChain.issueTx(tx)
        })(),
      (x) => x,
      Matcher.Get,
      () => tx,
      3000
    ],
    [
      "verify import tx has been committed",
      () => cChain.getAtomicTxStatus(tx.value),
      (x) => x,
      Matcher.toBe,
      () => "Accepted",
      3000
    ]
  ]
  createTests(tests_spec)
})

function createMsigKCAndAddSignatures(
  addresses: Buffer[],
  msg: Buffer,
  msigAliasBuffer: Buffer,
  owner: Owner,
  unsignedTx: PlatformUnsignedTx | UnsignedTx,
  chainPrefix: string
): MultisigKeyChain {
  let alias: string
  let chain: any
  if (chainPrefix === "P") {
    alias = PChainAlias
    chain = pChain
  } else if (chainPrefix === "C") {
    alias = PChainAlias
    chain = cChain
  }
  const msKeyChain = new MultisigKeyChain(
    avalanche.getHRP(),
    alias,
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
  // add KeyPairs to msKeyChain
  for (let i = 0; i < addresses.length; i++) {
    const keyPair = chain.keyChain().getKey(addresses[i])
    const signature = keyPair.sign(msg)
    msKeyChain.addKey(new MultisigKeyPair(msKeyChain, addresses[i], signature))
  }
  msKeyChain.buildSignatureIndices()
  return msKeyChain
}
