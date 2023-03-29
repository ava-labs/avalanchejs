import { getAvalanche, createTests, Matcher } from "../e2etestlib"
import { KeystoreAPI } from "src/apis/keystore/api"
import BN from "bn.js"
import { costImportTx } from "src/utils"
import { UTXOSet, Tx, UnsignedTx } from "src/apis/evm"
import { avm } from "src"
import { GetUTXOsResponse } from "src/apis/avm"
import { EVMCaminoConstants } from "../../src/apis/evm/camino_constants"

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

// x addresses
const adminAddress = "X-kopernikus1g65uqn6t77p656w64023nh8nd9updzmxh8ttv3"

// contract addresses
const contractAddr = "0x010000000000000000000000000000000000000a"

// c addresses
const adminAddr: string = "0x1f0e5c64afdf53175f78846f7125776e76fa8f34"

const kycXAddr = "X-kopernikus18jma8ppw3nhx5r4ap8clazz0dps7rv5uuvjh68"
const kycAddr: string = "0x8db97c7cece249c2b98bdc0226cc4c2a57bf52fc"

const gasFeeXAddr = "X-kopernikus13kyf72ftu4l77kss7xm0kshm0au29s48zjaygq"
const gasFeeAddr: string = "0x305cea207112c0561033133f816d7a2233699f06"

const blacklistAddr: string = "0x7f28dcdfc67af590918c271226034058fd15e868"

let keystore: KeystoreAPI
let contract: any
let xChain, cChain: any
let cAddressStrings: any
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
  const web3 = new Web3(rpcUrl)

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
  xChain.keyChain().importKey(adminPrivateKey)
  xChain.keyChain().importKey(gasFeeAddrPrivateKey)
  xChain.keyChain().importKey(kycAddrPrivateKey)

  cChain.keyChain().importKey(adminPrivateKey)
  cChain.keyChain().importKey(gasFeeAddrPrivateKey)
  cChain.keyChain().importKey(kycAddrPrivateKey)
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
      () => "2"
    ],
    [
      "grant kyc role to kycAddr",
      () =>
        contract.methods
          .grantRole(kycAddr, EVMCaminoConstants.KYCROLE)
          .send({ from: adminAddr, gas: 1000000 }),
      (x) => x.events.SetRole.returnValues.role,
      Matcher.toBe,
      () => "4"
    ],
    [
      "grant blacklist role to blacklistAddr",
      () =>
        contract.methods
          .grantRole(blacklistAddr, EVMCaminoConstants.BLACKLISTROLE)
          .send({ from: adminAddr, gas: 1000000 }),
      (x) => x.events.SetRole.returnValues.role,
      Matcher.toBe,
      () => "8"
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
      "revoke gas fee role",
      () =>
        contract.methods
          .revokeRole(gasFeeAddr, 2)
          .send({ from: adminAddr, gas: 1000000 }),
      (x) => x.events.DropRole.returnValues.role,
      Matcher.toBe,
      () => EVMCaminoConstants.GASFEEROLE.toString()
    ],
    [
      "revoke kyc role",
      () =>
        contract.methods
          .revokeRole(kycAddr, 4)
          .send({ from: adminAddr, gas: 1000000 }),
      (x) => x.events.DropRole.returnValues.role,
      Matcher.toBe,
      () => EVMCaminoConstants.KYCROLE.toString()
    ],
    [
      "revoke blacklist role",
      () =>
        contract.methods
          .revokeRole(blacklistAddr, 8)
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
          .grantRole(gasFeeAddr, 1)
          .send({ from: gasFeeAddr, gas: 1000000 }),
      (x) => x,
      Matcher.toThrow,
      () => "Transaction has been reverted by the EVM"
    ],
    [
      "gas fee address tries to give role to kycAddr",
      () =>
        contract.methods
          .grantRole(kycAddr, 2)
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
          .applyKycState(kycAddr, false, EVMCaminoConstants.KYCROLE)
          .send({ from: kycAddr, gas: 1000000 }),
      (x) => x.events.KycStateChanged.returnValues.newState,
      Matcher.toBe,
      () => EVMCaminoConstants.KYCROLE.toString()
    ],
    [
      "getKycState validation",
      () => contract.methods.getKycState(kycAddr).call(),
      (x) => x,
      Matcher.toBe,
      () => EVMCaminoConstants.KYCROLE.toString()
    ],
    [
      "applyKycState addition",
      () =>
        contract.methods
          .applyKycState(kycAddr, true, 4)
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
          .applyKycState(kycAddr, false, EVMCaminoConstants.KYCROLE)
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
