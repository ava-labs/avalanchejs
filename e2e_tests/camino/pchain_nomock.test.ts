import { createTests, getAvalanche, Matcher } from "../e2etestlib"
import { KeystoreAPI } from "src/apis/keystore/api"
import BN from "bn.js"
import { DepositOffer, Tx, UnsignedTx } from "../../src/apis/platformvm"
import { UnixNow } from "../../src/utils"
import { Buffer } from "buffer/"
import { OutputOwners } from "../../src/common"

const adminAddress = "X-kopernikus1g65uqn6t77p656w64023nh8nd9updzmxh8ttv3"
const adminNodePrivateKey =
  "PrivateKey-vmRQiZeXEXYMyJhEiqdC2z5JhuDbxL8ix9UVvjgMu2Er1NepE"
const adminNodeId = "NodeID-AK7sPBsZM9rQwse23aLhEEBPHZD5gkLrL"
const node6PrivateKey =
  "PrivateKey-UfV3iPVP8ThZuSXmUacsahdzePs5VkXct4XoQKsW9mffN1d8J"
const addrB = "X-kopernikus1s93gzmzuvv7gz8q4l83xccrdchh8mtm3xm5s2g"
const addrC = "X-kopernikus1lx58kettrnt2kyr38adyrrmxt5x57u4vg4cfky"
const addrBPrivateKey =
  "PrivateKey-21QkTk3Zn2wxLd1WvRgWn1UpT5BC2Pz6caKbcsSpmuz7Qm8R7C"
const node6Id = "NodeID-FHseEbTVS7U3odWfjgZYyygsv5gWCqVdk"
const user: string = "avalancheJspChainUser"
const passwd: string = "avalancheJsP@ssw4rd"
const user2: string = "avalancheJspChainUser2"
const passwd2: string = "avalancheJsP@ssw4rd2"
const avalanche = getAvalanche()

const startTime = UnixNow().add(new BN(60 * 1))
const endTime: BN = startTime.add(new BN(26300000))
const delegationFee: number = 10
const threshold: number = 1
const locktime: BN = new BN(0)
const memo: Buffer = Buffer.from(
  "PlatformVM utility method buildAddValidatorTx to add a validator to the primary subnet"
)
const P = function (s: string): string {
  return "P" + s.substring(1)
}

const sumAllValues = function (map: Map<string, string>): BN {
  return Object.values(map).reduce(
    (acc, val) => new BN(acc, 10).add(new BN(val, 10)),
    new BN(0)
  )
}

let keystore: KeystoreAPI
let depositOffers = {
  value: undefined as DepositOffer[] | undefined
}
let tx = { value: "" }
let xChain, pChain, pKeychain, pAddresses: any
let createdSubnetID = { value: "" }
let pAddressStrings: string[]
let balanceOutputs = { value: new Map() }

beforeAll(async () => {
  await avalanche.fetchNetworkSettings()
  keystore = new KeystoreAPI(avalanche)
  xChain = avalanche.XChain()
  pChain = avalanche.PChain()
  pKeychain = pChain.keyChain()
  pKeychain.importKey(adminNodePrivateKey)
  pKeychain.importKey(addrBPrivateKey)
  pKeychain.importKey(node6PrivateKey)
  pAddresses = pKeychain.getAddresses()
  pAddressStrings = pKeychain.getAddressStrings()
})

describe("Camino-PChain-Add-Validator", (): void => {
  const tests_spec: any = [
    [
      "assert pending validators=0",
      () => pChain.getPendingValidators(),
      (x) => x.validators.length,
      Matcher.toBe,
      () => 0
    ],
    [
      "addValidator - with admin PK",
      () =>
        (async function () {
          const stakeAmount: any = await pChain.getMinStake()
          const unsignedTx: UnsignedTx = await pChain.buildAddValidatorTx(
            undefined,
            [P(adminAddress)],
            [P(adminAddress)],
            [P(adminAddress)],
            adminNodeId,
            startTime,
            endTime,
            stakeAmount.minValidatorStake,
            [P(adminAddress)],
            delegationFee,
            locktime,
            threshold,
            memo
          )

          const tx: Tx = unsignedTx.sign(pKeychain)
          return pChain.issueTx(tx)
        })(),
      (x) => x,
      Matcher.toThrow,
      () => "couldn't issue tx: node is already a validator"
    ],
    [
      "addValidator - with unregistered node",
      () =>
        (async function () {
          const stakeAmount: any = await pChain.getMinStake()
          const unsignedTx: UnsignedTx = await pChain.buildAddValidatorTx(
            undefined,
            [P(adminAddress)],
            [P(adminAddress)],
            [P(adminAddress)],
            node6Id,
            startTime,
            endTime,
            stakeAmount.minValidatorStake,
            [P(adminAddress)],
            delegationFee,
            locktime,
            threshold,
            memo
          )

          const tx: Tx = unsignedTx.sign(pKeychain)
          return pChain.issueTx(tx)
        })(),
      (x) => x,
      Matcher.toThrow,
      () => "couldn't issue tx: no address registered for this node: not found"
    ],

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
      "register node6",
      () =>
        (async function () {
          const consortiumMemberAuthCredentials: [number, Buffer][] = [
            [0, pAddresses[1]]
          ]
          const unsignedTx: UnsignedTx = await pChain.buildRegisterNodeTx(
            undefined,
            [P(addrB)],
            [P(addrB)],
            undefined,
            node6Id,
            P(addrB),
            consortiumMemberAuthCredentials,
            memo
          )

          const tx: Tx = unsignedTx.sign(pKeychain)
          return pChain.issueTx(tx)
        })(),
      (x) => {
        return x
      },
      Matcher.Get,
      () => tx,
      3000
    ],
    [
      "verify register node tx has been committed",
      () => pChain.getTxStatus(tx.value),
      (x) => x.status,
      Matcher.toBe,
      () => "Committed",
      3000
    ],
    [
      "addValidator - return with node6 as a new consortium member",
      () =>
        (async function () {
          const stakeAmount: any = await pChain.getMinStake()
          const unsignedTx: UnsignedTx = await pChain.buildAddValidatorTx(
            undefined,
            [P(addrB)],
            [P(addrB)],
            [P(addrB)],
            node6Id,
            startTime,
            endTime,
            stakeAmount.minValidatorStake,
            [P(addrB)],
            delegationFee,
            locktime,
            threshold,
            memo
          )

          const tx: Tx = unsignedTx.sign(pKeychain)
          return pChain.issueTx(tx)
        })(),
      (x) => x,
      Matcher.Get,
      () => tx
    ],
    [
      "verify addValidator tx has been committed",
      () => pChain.getTxStatus(tx.value),
      (x) => x.status,
      Matcher.toBe,
      () => "Committed",
      3000
    ],
    [
      "assert pending validators=1",
      () => pChain.getPendingValidators(),
      (x) => x.validators.length,
      Matcher.toBe,
      () => 1
    ],
    [
      "create user2",
      () => keystore.createUser(user2, passwd2),
      (x) => x,
      Matcher.toEqual,
      () => {
        return {}
      }
    ],
    [
      "importKey of user2",
      () => pChain.importKey(user2, passwd2, addrBPrivateKey),
      (x) => x,
      Matcher.toBe,
      () => "P" + addrB.substring(1)
    ],
    [
      "createSubnet",
      () => pChain.createSubnet(user2, passwd2, [P(addrB)], 1),
      (x) => {
        return x
      },
      Matcher.Get,
      () => createdSubnetID
    ],
    [
      "addSubnetValidator addrb",
      () =>
        (async function () {
          const stakeAmount: any = await pChain.getMinStake()
          const subnetAuthCredentials: [number, Buffer][] = [[0, pAddresses[1]]]
          const unsignedTx: UnsignedTx = await pChain.buildAddSubnetValidatorTx(
            undefined,
            [P(addrB)],
            [P(addrB)],
            node6Id,
            startTime,
            endTime,
            stakeAmount.minValidatorStake,
            createdSubnetID.value,
            memo,
            new BN(0),
            {
              addresses: [pAddresses[1]],
              threshold: 1,
              signer: subnetAuthCredentials
            }
          )

          const tx: Tx = unsignedTx.sign(pKeychain)
          return pChain.issueTx(tx)
        })(),
      (x) => {
        return x
      },
      Matcher.Get,
      () => tx,
      3000
    ],
    [
      "assert pending validators of subnet = 1",
      () => pChain.getPendingValidators(createdSubnetID.value),
      (x) => x.validators.length,
      Matcher.toBe,
      () => 1,
      3000
    ]
  ]

  createTests(tests_spec)
})

describe("Camino-PChain-Deposit", (): void => {
  const tests_spec: any = [
    [
      "Get all deposit offers",
      () => pChain.getAllDepositOffers(),
      (x) => x,
      Matcher.Get,
      () => depositOffers
    ],
    [
      "Issue depositTx with inactive offer",
      () =>
        (async function () {
          const inactiveOffer: DepositOffer = getFirstDepositOfferWithFlag(
            depositOffers.value,
            1
          )
          const unsignedTx: UnsignedTx = await pChain.buildDepositTx(
            undefined,
            [P(addrB)],
            [P(addrB)],
            inactiveOffer.id,
            inactiveOffer.minDuration,
            new OutputOwners([pAddresses[1]], new BN(10000), 1),
            memo,
            new BN(0),
            inactiveOffer.minAmount
          )
          const tx: Tx = unsignedTx.sign(pKeychain)
          return pChain.issueTx(tx)
        })(),
      (x) => x,
      Matcher.toThrow,
      () => "couldn't issue tx: deposit offer inactive"
    ],
    [
      "Issue depositTx with duration < minDuration",
      () =>
        (async function () {
          const activeOffer: DepositOffer = getFirstDepositOfferWithFlag(
            depositOffers.value,
            0
          )
          const unsignedTx: UnsignedTx = await pChain.buildDepositTx(
            undefined,
            [P(addrB)],
            [P(addrB)],
            activeOffer.id,
            activeOffer.minDuration - 1,
            new OutputOwners([pAddresses[1]], new BN(10000), 1),
            memo,
            new BN(0),
            activeOffer.minAmount
          )
          const tx: Tx = unsignedTx.sign(pKeychain)
          return pChain.issueTx(tx)
        })(),
      (x) => x,
      Matcher.toThrow,
      () =>
        "couldn't issue tx: deposit duration is less than deposit offer minmum duration"
    ],
    [
      "Issue depositTx with duration > maxDuration",
      () =>
        (async function () {
          const activeOffer: DepositOffer = getFirstDepositOfferWithFlag(
            depositOffers.value,
            0
          )
          const unsignedTx: UnsignedTx = await pChain.buildDepositTx(
            undefined,
            [P(addrB)],
            [P(addrB)],
            activeOffer.id,
            activeOffer.maxDuration + 1,
            new OutputOwners([pAddresses[1]], new BN(10000), 1),
            memo,
            new BN(0),
            activeOffer.minAmount
          )
          const tx: Tx = unsignedTx.sign(pKeychain)
          return pChain.issueTx(tx)
        })(),
      (x) => x,
      Matcher.toThrow,
      () =>
        "couldn't issue tx: deposit duration is greater than deposit offer maximum duration"
    ],
    [
      "Get balance outputs",
      () => pChain.getBalance({ address: P(addrB) }),
      (x) => x,
      Matcher.Get,
      () => balanceOutputs
    ],
    [
      "Issue depositTx with insufficient unlocked funds",
      () =>
        (async function () {
          const activeOffer: DepositOffer = getFirstDepositOfferWithFlag(
            depositOffers.value,
            0
          )
          const unsignedTx: UnsignedTx = await pChain.buildDepositTx(
            undefined,
            [P(addrC)],
            [P(addrC)],
            activeOffer.id,
            activeOffer.maxDuration,
            new OutputOwners([pAddresses[1]], new BN(10000), 1),
            memo,
            new BN(0),
            sumAllValues(balanceOutputs.value["unlockedOutputs"]).add(new BN(1))
          )
          const tx: Tx = unsignedTx.sign(pKeychain)
          return pChain.issueTx(tx)
        })(),
      (x) => x,
      Matcher.toThrow,
      () => "can't create transferables: insufficient balance"
    ],
    [
      "Issue depositTx",
      () =>
        (async function () {
          const activeOffer: DepositOffer = getFirstDepositOfferWithFlag(
            depositOffers.value,
            0
          )
          const unsignedTx: UnsignedTx = await pChain.buildDepositTx(
            undefined,
            [P(addrB)],
            [P(addrB)],
            activeOffer.id,
            activeOffer.minDuration,
            new OutputOwners([pAddresses[1]]),
            memo,
            new BN(0),
            activeOffer.minAmount
          )
          const tx: Tx = unsignedTx.sign(pKeychain)
          return pChain.issueTx(tx)
        })(),
      (x) => x,
      Matcher.Get,
      () => tx
    ],
    [
      "Verify tx has been committed",
      () => {
        return pChain.getTxStatus(tx.value)
      },
      (x) => x.status,
      Matcher.toBe,
      () => "Committed",
      3000
    ],
    [
      "Verify deposited/depositedBonded amounts haven been appropriately increased",
      () => pChain.getBalance({ address: P(addrB) }),
      (x) =>
        sumAllValues(x.depositedOutputs).add(
          sumAllValues(x.bondedDepositedOutputs)
        ),
      Matcher.toEqual,
      () =>
        sumAllValues(balanceOutputs.value["depositedOutputs"]).add(
          sumAllValues(balanceOutputs.value["bondedDepositedOutputs"]).add(
            getFirstDepositOfferWithFlag(depositOffers.value, 0).minAmount
          )
        )
    ],
    [
      "Get balance outputs",
      () => pChain.getBalance({ address: P(addrB) }),
      (x) => x,
      Matcher.Get,
      () => balanceOutputs
    ],
    [
      "Attempt an invalid unlockDepositTx",
      () =>
        (async function () {
          const unsignedTx: UnsignedTx = await pChain.buildUnlockDepositTx(
            undefined,
            [P(addrB)],
            [P(addrB)]
          )
          const tx: Tx = unsignedTx.sign(pKeychain)
          return pChain.issueTx(tx)
        })(),
      (x) => x,
      Matcher.Get,
      () => tx
    ],
    [
      "Verify tx has been committed",
      () => {
        return pChain.getTxStatus(tx.value)
      },
      (x) => x.status,
      Matcher.toBe,
      () => "Committed",
      3000
    ],
    [
      "Verify deposited amounts haven NOT increased further",
      () => pChain.getBalance({ address: P(addrB) }),
      (x) =>
        sumAllValues(x.depositedOutputs).add(
          sumAllValues(x.bondedDepositedOutputs)
        ),
      Matcher.toEqual,
      () =>
        sumAllValues(balanceOutputs.value["depositedOutputs"]).add(
          sumAllValues(balanceOutputs.value["bondedDepositedOutputs"])
        )
    ]
  ]
  createTests(tests_spec)
})

function getFirstDepositOfferWithFlag(
  depositOffers: DepositOffer[],
  flag: number
): DepositOffer {
  return depositOffers.find((depositOffer) =>
    depositOffer.flags.eq(new BN(flag, 10))
  )
}
