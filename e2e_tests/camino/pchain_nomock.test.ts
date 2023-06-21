import { createTests, getAvalanche, Matcher } from "../e2etestlib"
import { KeystoreAPI } from "src/apis/keystore/api"
import BN from "bn.js"
import {
  DepositOffer,
  Tx,
  UnsignedTx,
  UTXOSet,
  PlatformVMConstants,
  Owner,
  PlatformVMAPI,
  ClaimAmountParams
} from "../../src/apis/platformvm"
import { UnixNow } from "../../src/utils"
import { BinTools } from "../../src/index"
import { Buffer } from "buffer/"
import {
  MultisigKeyChain,
  MultisigKeyPair,
  OutputOwners,
  ZeroBN
} from "../../src/common"
import { PChainAlias } from "../../src/utils"
import createHash from "create-hash"
import { ClaimType } from "../../src/apis/platformvm/claimtx"
const bintools = BinTools.getInstance()

// private keys
const adminNodePrivateKey =
  "PrivateKey-vmRQiZeXEXYMyJhEiqdC2z5JhuDbxL8ix9UVvjgMu2Er1NepE"
const addrBPrivateKey =
  "PrivateKey-21QkTk3Zn2wxLd1WvRgWn1UpT5BC2Pz6caKbcsSpmuz7Qm8R7C"
const addrCPrivateKey =
  "PrivateKey-Ge71NJhUY3TjZ9dLohijSnNq46QxobjqxHGMUDAPoVsNFA93w"
const node6PrivateKey =
  "PrivateKey-UfV3iPVP8ThZuSXmUacsahdzePs5VkXct4XoQKsW9mffN1d8J"
const node7PrivateKey =
  "PrivateKey-2DXzE36hZ3MSKxk1Un5mBHGwcV69CqkKvbVvSwFBhDRtnbFCDX"
const multiSigAliasMember1PrivateKey =
  "PrivateKey-2Vtf2ZhTRz6WcVcSH7cS7ghKneZxZ2L5W8assdCcaNDVdpoYfY"

// X addresses
const addrAdminString = "X-kopernikus1g65uqn6t77p656w64023nh8nd9updzmxh8ttv3"
const addrBString = "X-kopernikus1s93gzmzuvv7gz8q4l83xccrdchh8mtm3xm5s2g"
const addrCString = "X-kopernikus13kyf72ftu4l77kss7xm0kshm0au29s48zjaygq"

// P addresses - Buffer
let addrAdmin, addrB, addrC, addrNode7, addrSigner: Buffer

// Node ids
const adminNodeId = "NodeID-AK7sPBsZM9rQwse23aLhEEBPHZD5gkLrL"
const node6Id = "NodeID-FHseEbTVS7U3odWfjgZYyygsv5gWCqVdk"
const node7Id = "NodeID-AAFgkP7AVeQjmv4MSi2DaQbobg3wpZbFp"

// keystore users
const user: string = "avalancheJspChainUser" + Math.random()
const passwd: string = "avalancheJsP@ssw4rd"
const user2: string = "avalancheJspChainUser2" + Math.random()
const passwd2: string = "avalancheJsP@ssw4rd2"

// multisig
const multiSigUser: string = "avalancheJspChainUser3"
const multiSigPasswd: string = "avalancheJsP@ssw4rd3"
const multiSigAliasAddr = "X-kopernikus1fwrv3kj5jqntuucw67lzgu9a9tkqyczxgcvpst"
const multiSigAliasMember1Addr =
  "X-kopernikus1jla8ty5c9ud6lsj8s4re2dvzvfxpzrxdcrd8q7"

// test context
const avalanche = getAvalanche()
const startTime = UnixNow().add(new BN(600 * 1))
const endTime: BN = startTime.add(new BN(26300000))
const threshold: number = 1
const locktime: BN = new BN(0)
const memo: Buffer = Buffer.from(
  "PlatformVM utility method buildCaminoAddValidatorTx to add a validator to the primary subnet"
)
const interestRateDenominator = new BN(1_000_000 * (365 * 24 * 60 * 60))

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
let depositOffers = undefined as DepositOffer[] | undefined
let depositTx = { value: "" }
let tx = { value: "" }
let xChain, pKeychain, pAddresses: any
let pChain: PlatformVMAPI
let createdSubnetID = { value: "" }
let pAddressStrings: string[]
let pendingValidators = { value: "" }
let balanceOutputs = { value: new Map() }
let oneMinRewardsAmount: BN
let rewardsOwner: OutputOwners

beforeAll(async () => {
  await avalanche.fetchNetworkSettings()
  keystore = new KeystoreAPI(avalanche)
  xChain = avalanche.XChain()
  pChain = avalanche.PChain()
  pKeychain = pChain.keyChain()
  pKeychain.importKey(adminNodePrivateKey)
  pKeychain.importKey(addrBPrivateKey)
  pKeychain.importKey(addrCPrivateKey)
  pKeychain.importKey(node6PrivateKey)
  pKeychain.importKey(node7PrivateKey)
  // pKeychain.importKey(multiSigAddrPrivateKey)
  pKeychain.importKey(multiSigAliasMember1PrivateKey)
  pAddresses = pKeychain.getAddresses()
  pAddressStrings = pKeychain.getAddressStrings()

  addrAdmin = pAddresses[0]
  addrB = pAddresses[1]
  addrC = pAddresses[2]
  addrNode7 = pAddresses[4]
  addrSigner = pAddresses[5]

  // create user2
  await keystore.createUser(user2, passwd2)
  await pChain.importKey(user2, passwd2, addrBPrivateKey)

  depositOffers = await pChain.getAllDepositOffers()
  oneMinRewardsAmount = getOneMinuteDepositOffer()
    .minAmount.mul(
      new BN(
        getOneMinuteDepositOffer().minDuration -
          getOneMinuteDepositOffer().noRewardsPeriodDuration
      )
    )
    .mul(getOneMinuteDepositOffer().interestRateNominator)
    .div(interestRateDenominator)
  rewardsOwner = new OutputOwners([addrB])
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
          const unsignedTx: UnsignedTx = await pChain.buildCaminoAddValidatorTx(
            undefined,
            [P(addrAdminString)],
            [P(addrAdminString)],
            [P(addrAdminString)],
            adminNodeId,
            {
              address: P(addrAdminString),
              auth: [[0, P(addrAdminString)]]
            },
            startTime,
            endTime,
            stakeAmount.minValidatorStake,
            [P(addrAdminString)],
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
          const unsignedTx: UnsignedTx = await pChain.buildCaminoAddValidatorTx(
            undefined,
            [P(addrAdminString)],
            [P(addrAdminString)],
            [P(addrAdminString)],
            node6Id,
            {
              address: P(addrAdminString),
              auth: [[0, P(addrAdminString)]]
            },
            startTime,
            endTime,
            stakeAmount.minValidatorStake,
            [P(addrAdminString)],
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
            [0, addrB] // "P-kopernikus1s93gzmzuvv7gz8q4l83xccrdchh8mtm3xm5s2g"
          ]
          const unsignedTx: UnsignedTx = await pChain.buildRegisterNodeTx(
            undefined,
            [P(addrBString)], // "X-kopernikus1s93gzmzuvv7gz8q4l83xccrdchh8mtm3xm5s2g"
            [P(addrBString)],
            undefined,
            node6Id,
            P(addrBString),
            consortiumMemberAuthCredentials,
            memo
          )

          const tx: Tx = unsignedTx.sign(pKeychain)
          return pChain.issueTx(tx)
        })(),
      (x) => x,
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
      "addValidator - with node6 as a new consortium member and rewards owner different than node owner",
      () =>
        (async function () {
          const stakeAmount: any = await pChain.getMinStake()
          const unsignedTx: UnsignedTx = await pChain.buildCaminoAddValidatorTx(
            undefined,
            [P(addrBString)], // "X-kopernikus1s93gzmzuvv7gz8q4l83xccrdchh8mtm3xm5s2g"
            [P(addrBString)],
            [P(addrBString)],
            node6Id,
            {
              address: P(addrBString),
              auth: [[0, P(addrBString)]]
            },
            UnixNow().add(new BN(20)), // starttime should be very close to the current time so that this validator can claim rewards
            endTime,
            stakeAmount.minValidatorStake,
            [P(addrCString)],
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
      "createSubnet",
      () => pChain.createSubnet(user2, passwd2, [P(addrBString)], 1), // X-kopernikus1s93gzmzuvv7gz8q4l83xccrdchh8mtm3xm5s2g
      (x) => x,
      Matcher.Get,
      () => createdSubnetID
    ],
    [
      "addSubnetValidator addrb",
      () =>
        (async function () {
          const stakeAmount: any = await pChain.getMinStake()
          const subnetAuthCredentials: [number, Buffer][] = [[0, addrB]] // P-kopernikus1s93gzmzuvv7gz8q4l83xccrdchh8mtm3xm5s2g
          const unsignedTx: UnsignedTx = await pChain.buildAddSubnetValidatorTx(
            undefined,
            [P(addrBString)], // X-kopernikus1s93gzmzuvv7gz8q4l83xccrdchh8mtm3xm5s2g
            [P(addrBString)],
            node6Id,
            startTime,
            endTime,
            stakeAmount.minValidatorStake,
            createdSubnetID.value,
            memo,
            new BN(0),
            {
              addresses: [addrB],
              threshold: 1,
              signer: subnetAuthCredentials
            }
          )

          const tx: Tx = unsignedTx.sign(pKeychain)
          return pChain.issueTx(tx)
        })(),
      (x) => x,
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
      "Issue depositTx with inactive offer",
      () =>
        (async function () {
          const inactiveOffer: DepositOffer = getLockedPresale3yDepositOffer()
          const unsignedTx: UnsignedTx = await pChain.buildDepositTx(
            undefined,
            [P(addrBString)],
            [P(addrBString)],
            inactiveOffer.id,
            inactiveOffer.minDuration,
            new OutputOwners([addrB], new BN(10000), 1),
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
          const activeOffer: DepositOffer = getTest1DepositOffer()
          const unsignedTx: UnsignedTx = await pChain.buildDepositTx(
            undefined,
            [P(addrBString)],
            [P(addrBString)],
            activeOffer.id,
            activeOffer.minDuration - 1,
            new OutputOwners([addrB], new BN(10000), 1),
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
          const activeOffer: DepositOffer = getTest1DepositOffer()
          const unsignedTx: UnsignedTx = await pChain.buildDepositTx(
            undefined,
            [P(addrBString)],
            [P(addrBString)],
            activeOffer.id,
            activeOffer.maxDuration + 1,
            new OutputOwners([addrB], new BN(10000), 1),
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
      () => pChain.getBalance([P(addrBString)]),
      (x) => x,
      Matcher.Get,
      () => balanceOutputs
    ],
    [
      "Issue depositTx with insufficient unlocked funds",
      () =>
        (async function () {
          const activeOffer: DepositOffer = getTest1DepositOffer()
          const unsignedTx: UnsignedTx = await pChain.buildDepositTx(
            undefined,
            [P(addrCString)],
            [P(addrCString)],
            activeOffer.id,
            activeOffer.maxDuration,
            new OutputOwners([addrB], new BN(10000), 1),
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
          const activeOffer: DepositOffer = getTest1DepositOffer()
          const unsignedTx: UnsignedTx = await pChain.buildDepositTx(
            undefined,
            [P(addrBString)],
            [P(addrBString)],
            activeOffer.id,
            activeOffer.maxDuration,
            rewardsOwner,
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
      () => pChain.getBalance([P(addrBString)]),
      (x) =>
        sumAllValues(x.depositedOutputs).add(
          sumAllValues(x.bondedDepositedOutputs)
        ),
      Matcher.toEqual,
      () =>
        sumAllValues(balanceOutputs.value["depositedOutputs"]).add(
          sumAllValues(balanceOutputs.value["bondedDepositedOutputs"]).add(
            getTest1DepositOffer().minAmount
          )
        )
    ],
    [
      "Get balance outputs",
      () => pChain.getBalance([P(addrBString)]),
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
            [P(addrBString)],
            [P(addrBString)],
            undefined,
            undefined,
            ZeroBN
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
      () => pChain.getBalance([P(addrBString)]),
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
describe("Camino-PChain-Auto-Unlock-Deposit-Full-Amount", (): void => {
  const tests_spec: any = [
    [
      "Get balance outputs",
      () => pChain.getBalance([P(addrBString)]),
      (x) => x,
      Matcher.Get,
      () => balanceOutputs
    ],
    [
      "Issue depositTx -> presale1min",
      () =>
        (async function () {
          const activeOffer: DepositOffer = getOneMinuteDepositOffer()
          const unsignedTx: UnsignedTx = await pChain.buildDepositTx(
            undefined,
            [P(addrBString)],
            [P(addrBString)],
            activeOffer.id,
            activeOffer.minDuration,
            rewardsOwner,
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
      () => pChain.getBalance([P(addrBString)]),
      (x) =>
        sumAllValues(x.depositedOutputs).add(
          sumAllValues(x.bondedDepositedOutputs)
        ),
      Matcher.toEqual,
      () =>
        sumAllValues(balanceOutputs.value["depositedOutputs"]).add(
          sumAllValues(balanceOutputs.value["bondedDepositedOutputs"]).add(
            getOneMinuteDepositOffer().minAmount
          )
        )
    ],
    [
      "Refresh balance outputs",
      () => pChain.getBalance([P(addrBString)]),
      (x) => x,
      Matcher.Get,
      () => balanceOutputs
    ],
    [
      "Wait 1 min for deposit to be unlocked & issue a random tx to trigger a block built",
      () => pChain.createSubnet(user2, passwd2, [P(addrBString)], 1),
      (x) => {
        return x
      },
      Matcher.Get,
      () => createdSubnetID,
      60000 + 1000 // presale1min has a 1 minute unlock period +1 second
    ],
    [
      "Verify deposited/depositedBonded amounts have decreased by the amount of the deposit",
      () => pChain.getBalance([P(addrBString)]),
      (x) =>
        sumAllValues(x.depositedOutputs)
          .add(sumAllValues(x.bondedDepositedOutputs))
          .toNumber(),
      Matcher.toEqual,
      () =>
        sumAllValues(balanceOutputs.value["depositedOutputs"])
          .add(sumAllValues(balanceOutputs.value["bondedDepositedOutputs"]))
          .sub(getOneMinuteDepositOffer().minAmount)
          .toNumber(),
      3000
    ],
    [
      "Refresh balance outputs",
      () => pChain.getBalance([P(addrBString)]),
      (x) => x,
      Matcher.Get,
      () => balanceOutputs
    ],
    [
      "Issue a claimTx",
      () =>
        (async function () {
          const unsignedTx: UnsignedTx = await pChain.buildClaimTx(
            undefined,
            [P(addrBString)],
            [P(addrBString)],
            undefined,
            ZeroBN,
            1,
            [
              {
                amount: oneMinRewardsAmount,
                claimType: ClaimType.EXPIRED_DEPOSIT_REWARD,
                owners: new OutputOwners([addrB], ZeroBN, 1),
                sigIdxs: [0]
              } as ClaimAmountParams
            ]
          )
          const claimTx: Tx = unsignedTx.sign(pKeychain)
          return pChain.issueTx(claimTx)
        })(),
      (x) => x,
      Matcher.Get,
      () => tx
    ],
    [
      "Verify tx has been committed",
      () => pChain.getTxStatus(tx.value),
      (x) => x.status,
      Matcher.toBe,
      () => "Committed",
      3000
    ],
    [
      "Verify deposited/depositedBonded amounts have increased by rewards amount (minus tx fee)",
      () => pChain.getBalance([P(addrBString)]),
      (x) => sumAllValues(x.unlockedOutputs),
      Matcher.toEqual,
      () =>
        sumAllValues(balanceOutputs.value["unlockedOutputs"])
          .add(oneMinRewardsAmount)
          .sub(avalanche.PChain().getTxFee())
    ]
  ]
  createTests(tests_spec)
})
describe("Camino-PChain-Auto-Unlock-Deposit-Half-Amount", (): void => {
  const tests_spec: any = [
    [
      "Get balance outputs",
      () => pChain.getBalance([P(addrBString)]),
      (x) => x,
      Matcher.Get,
      () => balanceOutputs
    ],
    [
      "Issue depositTx -> presale1min",
      () =>
        (async function () {
          const activeOffer: DepositOffer = getOneMinuteDepositOffer()
          const unsignedTx: UnsignedTx = await pChain.buildDepositTx(
            undefined,
            [P(addrBString)],
            [P(addrBString)],
            activeOffer.id,
            activeOffer.minDuration,
            rewardsOwner,
            memo,
            new BN(0),
            activeOffer.minAmount
          )
          const tx: Tx = unsignedTx.sign(pKeychain)
          return pChain.issueTx(tx)
        })(),
      (x) => x,
      Matcher.Get,
      () => depositTx
    ],
    [
      "Verify tx has been committed",
      () => {
        return pChain.getTxStatus(depositTx.value)
      },
      (x) => x.status,
      Matcher.toBe,
      () => "Committed",
      3000
    ],
    [
      "Verify deposited/depositedBonded amounts have increased by the deposited amount",
      () => pChain.getBalance([P(addrBString)]),
      (x) =>
        sumAllValues(x.depositedOutputs).add(
          sumAllValues(x.bondedDepositedOutputs)
        ),
      Matcher.toEqual,
      () =>
        sumAllValues(balanceOutputs.value["depositedOutputs"]).add(
          sumAllValues(balanceOutputs.value["bondedDepositedOutputs"]).add(
            getOneMinuteDepositOffer().minAmount
          )
        )
    ],
    [
      "Refresh balance outputs",
      () => pChain.getBalance([P(addrBString)]),
      (x) => x,
      Matcher.Get,
      () => balanceOutputs
    ],
    [
      "Wait 75% of unlock duration and issue an unlockDepositTx to manually unlock deposit",
      () =>
        (async function () {
          const unsignedTx: UnsignedTx = await pChain.buildUnlockDepositTx(
            undefined,
            [P(addrBString)],
            [P(addrBString)],
            undefined,
            undefined,
            ZeroBN
          )
          const tx: Tx = unsignedTx.sign(pKeychain)
          return pChain.issueTx(tx)
        })(),
      (x) => x,
      Matcher.Get,
      () => tx,
      45000 // 75% * unlock period
    ],
    [
      "Verify tx has been committed",
      () => pChain.getTxStatus(tx.value),
      (x) => x.status,
      Matcher.toBe,
      () => "Committed",
      3000
    ],
    [
      "Verify deposited/depositedBonded amounts have decreased by 50%",
      () => pChain.getBalance([P(addrBString)]),
      (x) =>
        sumAllValues(x.depositedOutputs).add(
          sumAllValues(x.bondedDepositedOutputs)
        ),
      Matcher.toEqual,
      () =>
        sumAllValues(balanceOutputs.value["depositedOutputs"]).add(
          sumAllValues(balanceOutputs.value["bondedDepositedOutputs"]).sub(
            getOneMinuteDepositOffer().minAmount.mul(
              new BN(0.5) // 50% of deposit amount
            )
          )
        )
    ],
    [
      "Verify unlocked amounts haven been appropriately increased by 50% of the locked amount",
      () => pChain.getBalance([P(addrBString)]),
      (x) => sumAllValues(x.unlockedOutputs),
      Matcher.toEqual,
      () =>
        sumAllValues(balanceOutputs.value["unlockedOutputs"])
          .add(
            getOneMinuteDepositOffer().minAmount.mul(
              new BN(0.5) // 50% of deposit amount
            )
          )
          .sub(avalanche.PChain().getTxFee())
    ],
    [
      "Wait unlock duration and & issue a random tx to trigger build block",
      () => pChain.createSubnet(user2, passwd2, [P(addrBString)], 1),
      (x) => {
        return x
      },
      Matcher.Get,
      () => createdSubnetID,
      16000 // 25% * unlock period + 1s
    ],
    [
      "Verify deposited/depositedBonded amounts haven been appropriately decreased by 100%",
      () => pChain.getBalance([P(addrBString)]),
      (x) =>
        sumAllValues(x.depositedOutputs).add(
          sumAllValues(x.bondedDepositedOutputs)
        ),
      Matcher.toEqual,
      () =>
        sumAllValues(balanceOutputs.value["depositedOutputs"]).add(
          sumAllValues(balanceOutputs.value["bondedDepositedOutputs"]).sub(
            getOneMinuteDepositOffer().minAmount
          )
        ),
      3000
    ]
  ]
  createTests(tests_spec)
})

describe("Camino-PChain-Multisig", (): void => {
  const tests_spec: any = [
    [
      "createUser",
      () => keystore.createUser(multiSigUser, multiSigPasswd),
      (x) => x,
      Matcher.toEqual,
      () => {
        return {}
      }
    ],
    [
      "register node",
      () =>
        (async function () {
          const msigAliasBuffer = pChain.parseAddress(P(multiSigAliasAddr))
          const owner = await pChain.getMultisigAlias(P(multiSigAliasAddr))
          const platformVMUTXOResponse: any = await pChain.getUTXOs([
            P(multiSigAliasAddr)
          ])
          const utxoSet: UTXOSet = platformVMUTXOResponse.utxos

          const unsignedTx: UnsignedTx = await pChain.buildRegisterNodeTx(
            utxoSet,
            [[P(multiSigAliasAddr)], [P(multiSigAliasMember1Addr)]],
            [P(multiSigAliasAddr)],
            undefined,
            node7Id,
            P(multiSigAliasAddr),
            [[0, P(multiSigAliasAddr)]],
            undefined,
            locktime,
            owner.threshold
          )

          const txbuff = unsignedTx.toBuffer()
          const msg: Buffer = Buffer.from(
            createHash("sha256").update(txbuff).digest()
          )

          const msKeyChain = createMsigKCAndAddSignatures(
            [addrNode7, addrSigner],
            msg,
            msigAliasBuffer,
            owner,
            unsignedTx
          )
          const tx: Tx = unsignedTx.sign(msKeyChain)
          return pChain.issueTx(tx)
        })(),
      (x) => {
        return x
      },
      Matcher.Get,
      () => tx
    ],
    [
      "Get pending validators",
      () => pChain.getPendingValidators(),
      (x) => x.validators.length,
      Matcher.Get,
      () => pendingValidators
    ],
    [
      "addValidator in main net",
      () =>
        (async function () {
          const msigAliasBuffer = pChain.parseAddress(P(multiSigAliasAddr))
          const owner = await pChain.getMultisigAlias(P(multiSigAliasAddr))
          const platformVMUTXOResponse: any = await pChain.getUTXOs([
            P(multiSigAliasAddr)
          ])
          const utxoSet: UTXOSet = platformVMUTXOResponse.utxos

          const unsignedTx: UnsignedTx = await pChain.buildCaminoAddValidatorTx(
            utxoSet,
            [P(multiSigAliasAddr)],
            [[P(multiSigAliasAddr)], [pAddressStrings[5]]],
            [P(multiSigAliasAddr)],
            node7Id, // the node where the alias is registered
            {
              address: P(multiSigAliasAddr),
              auth: [[0, pAddressStrings[5]]]
            },
            startTime,
            endTime,
            new BN(2000000000000),
            [P(multiSigAliasAddr)],
            undefined,
            threshold,
            undefined,
            locktime,
            owner.threshold,
            owner.threshold
          )

          const txbuff = unsignedTx.toBuffer()
          const msg: Buffer = Buffer.from(
            createHash("sha256").update(txbuff).digest()
          )
          const msKeyChain = createMsigKCAndAddSignatures(
            pAddresses,
            msg,
            msigAliasBuffer,
            owner,
            unsignedTx
          )
          const tx: Tx = unsignedTx.sign(msKeyChain)
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
      "assert pending validators of main net",
      () => pChain.getPendingValidators(),
      (x) => x.validators.length,
      Matcher.toBe,
      () => pendingValidators.value + 1,
      3000
    ],
    [
      "importKey of multiSigUser",
      () =>
        pChain.importKey(
          multiSigUser,
          multiSigPasswd,
          multiSigAliasMember1PrivateKey
        ),
      (x) => x,
      Matcher.toBe,
      () => P(multiSigAliasMember1Addr)
    ],
    [
      "createSubnet",
      () =>
        pChain.createSubnet(
          multiSigUser,
          multiSigPasswd,
          [P(multiSigAliasMember1Addr)],
          1
        ),
      (x) => x,
      Matcher.Get,
      () => createdSubnetID
    ],
    [
      "addSubnetValidator",
      () =>
        (async function () {
          const msigAliasBuffer = pChain.parseAddress(P(multiSigAliasAddr))
          const owner = await pChain.getMultisigAlias(P(multiSigAliasAddr))
          const platformVMUTXOResponse: any = await pChain.getUTXOs([
            P(multiSigAliasAddr)
          ])
          const utxoSet: UTXOSet = platformVMUTXOResponse.utxos
          const subnetAuthCredentials: [number, Buffer][] = [[0, addrSigner]]
          const stakeAmount: any = await pChain.getMinStake()

          const unsignedTx: UnsignedTx = await pChain.buildAddSubnetValidatorTx(
            utxoSet,
            [[P(multiSigAliasAddr)], [pAddressStrings[5]]],
            [P(multiSigAliasAddr)],
            node7Id,
            startTime,
            startTime.add(new BN(263000)),
            stakeAmount.minValidatorStake,
            createdSubnetID.value,
            undefined,
            ZeroBN,
            {
              addresses: [addrSigner],
              threshold: 1,
              signer: subnetAuthCredentials
            },
            owner.threshold
          )

          const txbuff = unsignedTx.toBuffer()
          const msg: Buffer = Buffer.from(
            createHash("sha256").update(txbuff).digest()
          )

          const msKeyChain = createMsigKCAndAddSignatures(
            pAddresses,
            msg,
            msigAliasBuffer,
            owner,
            unsignedTx
          )
          const tx: Tx = unsignedTx.sign(msKeyChain)
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
      "assert pending validators of subnet",
      () => pChain.getPendingValidators(createdSubnetID.value),
      (x) => x.validators.length,
      Matcher.toBe,
      () => 1,
      3000
    ]
  ]
  createTests(tests_spec)
})
describe("Camino-PChain-Claim-Validator-Rewards", (): void => {
  const tests_spec: any = [
    [
      "Get balance outputs after rewards have been exported to P chain",
      () =>
        (async function () {
          // check every 5 seconds if rewards have been exported to P chain
          let claimables = await pChain.getClaimables([
            { addresses: [P(addrAdminString)], locktime: "0", threshold: 1 }
          ])
          while (
            claimables.claimables.length == 0 ||
            claimables.claimables[0].validatorRewards.isZero()
          ) {
            await new Promise((resolve) => setTimeout(resolve, 5000))
            claimables = await pChain.getClaimables([
              { addresses: [P(addrAdminString)], locktime: "0", threshold: 1 }
            ])
          }
          return pChain.getBalance([P(addrAdminString)])
        })(),
      (x) => x,
      Matcher.Get,
      () => balanceOutputs
    ],
    [
      "Claim validator rewards",
      () =>
        (async function () {
          const unsignedTx: UnsignedTx = await pChain.buildClaimTx(
            undefined,
            [P(addrAdminString)],
            [P(addrAdminString)],
            undefined,
            ZeroBN,
            1,
            [
              {
                amount: new BN(1),
                claimType: ClaimType.VALIDATOR_REWARD,
                owners: new OutputOwners([addrAdmin], ZeroBN, 1),
                sigIdxs: [0]
              } as ClaimAmountParams
            ]
          )
          const claimTx: Tx = unsignedTx.sign(pKeychain)
          return pChain.issueTx(claimTx)
        })(),
      (x) => x,
      Matcher.Get,
      () => tx
    ],
    [
      "Verify claim tx has been committed",
      () => pChain.getTxStatus(tx.value),
      (x) => x.status,
      Matcher.toBe,
      () => "Committed",
      3000
    ],
    [
      "Verify unlocked amounts have increased by rewards amount (minus tx fee)",
      () => pChain.getBalance([P(addrAdminString)]),
      (x) => sumAllValues(x.unlockedOutputs),
      Matcher.toEqual,
      () =>
        sumAllValues(balanceOutputs.value["unlockedOutputs"])
          .add(new BN(1)) // claimed reward
          .sub(avalanche.PChain().getTxFee())
    ],
    [
      "Refresh balance outputs",
      () => pChain.getBalance([P(addrAdminString)]),
      (x) => x,
      Matcher.Get,
      () => balanceOutputs
    ],
    [
      "Claim validator rewards from a different address",
      () =>
        (async function () {
          const unsignedTx: UnsignedTx = await pChain.buildClaimTx(
            undefined,
            [P(addrBString)],
            [P(addrBString)],
            undefined,
            ZeroBN,
            1,
            [
              {
                amount: new BN(1),
                claimType: ClaimType.VALIDATOR_REWARD,
                owners: new OutputOwners([addrAdmin], ZeroBN, 1),
                sigIdxs: [0]
              } as ClaimAmountParams
            ]
          )
          const claimTx: Tx = unsignedTx.sign(pKeychain)
          return pChain.issueTx(claimTx)
        })(),
      (x) => x,
      Matcher.Get,
      () => tx
    ],
    [
      "Verify claim tx has been committed",
      () => pChain.getTxStatus(tx.value),
      (x) => x.status,
      Matcher.toBe,
      () => "Committed",
      3000
    ],
    [
      "Verify unlocked amounts have increased by rewards amount",
      () => pChain.getBalance([P(addrAdminString)]),
      (x) => sumAllValues(x.unlockedOutputs),
      Matcher.toEqual,
      () => sumAllValues(balanceOutputs.value["unlockedOutputs"]).add(new BN(1)) // claimed reward
    ],
    [
      "Get balance outputs for addrC",
      () => pChain.getBalance([P(addrCString)]),
      (x) => x,
      Matcher.Get,
      () => balanceOutputs
    ],
    [
      "Claim validator rewards for a rewards owner different than node owner",
      () =>
        (async function () {
          const unsignedTx: UnsignedTx = await pChain.buildClaimTx(
            undefined,
            [P(addrBString)],
            [P(addrBString)],
            undefined,
            ZeroBN,
            1,
            [
              {
                amount: new BN(1),
                claimType: ClaimType.VALIDATOR_REWARD,
                owners: new OutputOwners([addrC], ZeroBN, 1), // addrC being the rewards owner
                sigIdxs: [0]
              } as ClaimAmountParams
            ]
          )
          const claimTx: Tx = unsignedTx.sign(pKeychain)
          return pChain.issueTx(claimTx)
        })(),
      (x) => x,
      Matcher.Get,
      () => tx
    ],
    [
      "Verify claim tx has been committed",
      () => pChain.getTxStatus(tx.value),
      (x) => x.status,
      Matcher.toBe,
      () => "Committed",
      3000
    ],
    [
      "Verify unlocked amounts have increased by rewards amount",
      () => pChain.getBalance([P(addrCString)]),
      (x) => sumAllValues(x.unlockedOutputs),
      Matcher.toEqual,
      () => sumAllValues(balanceOutputs.value["unlockedOutputs"]).add(new BN(1)) // claimed reward
    ]
  ]

  createTests(tests_spec)
})

function getOneMinuteDepositOffer(): DepositOffer {
  return depositOffers.find((offer) => {
    return (
      Buffer.from(offer.memo.substring(2), "hex").toString() == "presale1min"
    )
  })
}
function getLockedPresale3yDepositOffer(): DepositOffer {
  return depositOffers.find((offer) => {
    return (
      Buffer.from(offer.memo.substring(2), "hex").toString() ==
      "lockedpresale3y"
    )
  })
}
function getTest1DepositOffer(): DepositOffer {
  return depositOffers.find((offer) => {
    return Buffer.from(offer.memo.substring(2), "hex")
      .toString()
      .includes("depositOffer test#1")
  })
}
function createMsigKCAndAddSignatures(
  addresses: Buffer[],
  msg: Buffer,
  msigAliasBuffer: Buffer,
  owner: Owner,
  unsignedTx: UnsignedTx
): MultisigKeyChain {
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
  // add KeyPairs to msKeyChain
  for (let i = 0; i < addresses.length; i++) {
    const keyPair = pKeychain.getKey(addresses[i])
    const signature = keyPair.sign(msg)
    msKeyChain.addKey(new MultisigKeyPair(msKeyChain, addresses[i], signature))
  }
  msKeyChain.buildSignatureIndices()
  return msKeyChain
}
