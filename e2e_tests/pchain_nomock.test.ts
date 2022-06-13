import { getAvalanche, createTests, Matcher } from "./e2etestlib"
import { KeystoreAPI } from "src/apis/keystore/api"
import BN from "bn.js"

describe("PChain", (): void => {
  let tx = { value: "" }
  let addrB = { value: "" }
  let addrC = { value: "" }
  let createdSubnetID = { value: "" }

  const avalanche = getAvalanche()
  const pchain = avalanche.PChain()
  const keystore = new KeystoreAPI(avalanche)

  const now: number = new Date().getTime()
  const startTime: Date = new Date(now + 800)
  const endTime: Date = new Date(now + 50000)
  const stakeAmount: BN = new BN(200000000000)

  const user: string = "avalancheJspChainUser"
  const passwd: string = "avalancheJsP@ssw4rd"
  const badUser: string = "asdfasdfsa"
  const badPass: string = "pass"
  const memo: string = "hello world"
  const whaleAddr: string = "P-custom18jma8ppw3nhx5r4ap8clazz0dps7rv5u9xde7p"
  const key: string =
    "PrivateKey-ewoqjP7PxY4yr3iLTpLisriqt94hdyDFNgchSxGGztUrTXtNN"
  const nodeID: string = "NodeID-7Xhw2mDxuDS44j42TCB6U5579esbSt3Lg"
  const subnetID: string = "2bGsYJorY6X7RhjPBFs3kYjiNEHo4zGrD2eeyZbb43T2KKi7fM"
  const xChainAddr: string = "X-custom18jma8ppw3nhx5r4ap8clazz0dps7rv5u9xde7p"
  const avalancheBlockChainID: string =
    "2VvmkRw4yrz8tPrVnCCbvEK1JxNyujpqhmU6SGonxMpkWBx9UD"

  const rewardUTXOTxID: string =
    "2nmH8LithVbdjaXsxVQCQfXtzN9hBbmebrsaEYnLM9T32Uy2Y4"
  // test_name        response_promise                            resp_fn          matcher           expected_value/obtained_value
  const tests_spec: any = [
    [
      "createUser",
      () => keystore.createUser(user, passwd),
      (x) => x,
      Matcher.toBe,
      () => true
    ],
    [
      "createaddrB",
      () => pchain.createAddress(user, passwd),
      (x) => x,
      Matcher.Get,
      () => addrB
    ],
    [
      "createaddrC",
      () => pchain.createAddress(user, passwd),
      (x) => x,
      Matcher.Get,
      () => addrC
    ],
    [
      "incorrectUser",
      () => pchain.listAddresses(badUser, passwd),
      (x) => x,
      Matcher.toThrow,
      () =>
        `problem retrieving user "${badUser}": incorrect password for user "${badUser}"`
    ],
    [
      "incorrectPass",
      () => pchain.listAddresses(user, badPass),
      (x) => x,
      Matcher.toThrow,
      () =>
        `problem retrieving user "${user}": incorrect password for user "${user}"`
    ],
    [
      "getBalance",
      () => pchain.getBalance(whaleAddr),
      (x) => x.balance,
      Matcher.toBe,
      () => "30000000000000000"
    ],
    [
      "getBalance2",
      () => pchain.getBalance(whaleAddr),
      (x) => x.utxoIDs[0].txID,
      Matcher.toBe,
      () => "11111111111111111111111111111111LpoYY"
    ],
    [
      "getBlockchainsC",
      () => pchain.getBlockchains(),
      (x) => x[0].id,
      Matcher.toBe,
      () => "BR28ypgLATNS6PbtHMiJ7NQ61vfpT27Hj8tAcZ1AHsfU5cz88"
    ],
    [
      "getBlockchainsX",
      () => pchain.getBlockchains(),
      (x) => x[1].id,
      Matcher.toBe,
      () => "qzfF3A11KzpcHkkqznEyQgupQrCNS6WV6fTUTwZpEKqhj1QE7"
    ],
    [
      "getBlockchainStatus",
      () => pchain.getBlockchainStatus(avalancheBlockChainID),
      (x) => x,
      Matcher.toBe,
      () => "Unknown"
    ],
    [
      "getCurrentSupply",
      () => pchain.getCurrentSupply(),
      (x) => {
        return x.toString()
      },
      Matcher.toBe,
      () => "361196333750752149"
    ],
    [
      "getHeight",
      () => pchain.getHeight(),
      (x) => x.toString(),
      Matcher.toEqual,
      () => "0"
    ],
    [
      "getMinStake",
      () => pchain.getMinStake(),
      (x) => {
        return x.minDelegatorStake.toString()
      },
      Matcher.toBe,
      () => "25000000000"
    ],
    [
      "importKey",
      () => pchain.importKey(user, passwd, key),
      (x) => x,
      Matcher.toBe,
      () => whaleAddr
    ],

    [
      "listAddrs",
      () => pchain.listAddresses(user, passwd),
      (x) => x.sort(),
      Matcher.toEqual,
      () => [whaleAddr, addrB.value, addrC.value].sort()
    ],

    [
      "createSubnet",
      () => pchain.createSubnet(user, passwd, [whaleAddr], 1),
      (x) => {
        return x
      },
      Matcher.Get,
      () => createdSubnetID
    ],
    [
      "getCurrentValidators",
      () => pchain.getCurrentValidators(),
      (x) => x.validators.length,
      Matcher.toBe,
      () => 5
    ],
    [
      "getRewardUTXOs",
      () => pchain.getRewardUTXOs(rewardUTXOTxID),
      (x) => x.utxos.length,
      Matcher.toBe,
      () => 0
    ],
    [
      "getStakeOutputs",
      () => pchain.getStake([whaleAddr]),
      (x) => x.stakedOutputs.length,
      Matcher.toBe,
      () => 0
    ],
    [
      "getStake",
      () => pchain.getStake([whaleAddr]),
      (x) => x.staked.toString(),
      Matcher.toBe,
      () => "0"
    ],

    [
      "addDelegator",
      () =>
        pchain.addDelegator(
          user,
          passwd,
          nodeID,
          startTime,
          endTime,
          stakeAmount,
          whaleAddr
        ),
      (x) => {
        return x
      },
      Matcher.toThrow,
      () =>
        "couldn't unmarshal an argument. Ensure arguments are valid and properly formatted. See documentation for example calls"
    ],
    [
      "addValidator",
      () =>
        pchain.addValidator(
          user,
          passwd,
          nodeID,
          startTime,
          endTime,
          stakeAmount,
          whaleAddr,
          new BN(10)
        ),
      (x) => {
        return x
      },
      Matcher.toThrow,
      () =>
        "couldn't unmarshal an argument. Ensure arguments are valid and properly formatted. See documentation for example calls"
    ],
    [
      "exportKey",
      () => pchain.exportKey(user, passwd, addrB.value),
      (x) => x,
      Matcher.toMatch,
      () => /PrivateKey-\w*/
    ],
    // [
    //   "exportAVAX",
    //   () => pchain.exportAVAX(user, passwd, new BN(10), xChainAddr),
    //   (x) => x,
    //   Matcher.toThrow,
    //   () =>
    //     "failed semanticVerifySpend: failed to read consumed UTXO 11111111111111111111111111111111LpoYY:0 due to: not found"
    // ],
    [
      "getTx",
      () => pchain.getTx(tx.value),
      (x) => x,
      Matcher.toThrow,
      () =>
        "couldn't unmarshal an argument. Ensure arguments are valid and properly formatted. See documentation for example calls"
    ],
    [
      "getTxStatus",
      () =>
        pchain.getTxStatus(
          "2JxmsgSJxMrddRUsKCxAagdvax3s6kY9xiivyzHRMqFfuRjFi2"
        ),
      (x) => x,
      Matcher.toEqual,
      () => ({ status: "Unknown" })
    ],
    [
      "importAVAX",
      () => pchain.importAVAX(user, passwd, addrB.value, "X"),
      (x) => x,
      Matcher.toThrow,
      () => "no spendable funds were found"
    ]
  ]

  createTests(tests_spec)
})