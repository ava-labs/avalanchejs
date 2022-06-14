/**
 * @packageDocumentation
 * @module API-AVM
 */
import BN from "bn.js"
import { Buffer } from "buffer/"
import AvalancheCore from "../../avalanche"
import BinTools from "../../utils/bintools"
import { UTXO, UTXOSet } from "./utxos"
import { AVMConstants } from "./constants"
import { KeyChain } from "./keychain"
import { Tx, UnsignedTx } from "./tx"
import { PayloadBase } from "../../utils/payload"
import { SECPMintOutput } from "./outputs"
import { InitialStates } from "./initialstates"
import { UnixNow } from "../../utils/helperfunctions"
import { JRPCAPI } from "../../common/jrpcapi"
import { RequestResponseData } from "../../common/apibase"
import { Defaults, PrimaryAssetAlias, ONEAVAX } from "../../utils/constants"
import { MinterSet } from "./minterset"
import { PersistanceOptions } from "../../utils/persistenceoptions"
import { OutputOwners } from "../../common/output"
import { SECPTransferOutput } from "./outputs"
import {
  AddressError,
  GooseEggCheckError,
  ChainIdError,
  NoAtomicUTXOsError,
  SymbolError,
  NameError,
  TransactionError
} from "../../utils/errors"
import { Serialization, SerializedType } from "../../utils"
import {
  BuildGenesisParams,
  CreateAddressParams,
  CreateFixedCapAssetParams,
  CreateVariableCapAssetParams,
  ExportParams,
  ExportKeyParams,
  GetAllBalancesParams,
  GetAssetDescriptionParams,
  GetAVAXAssetIDParams,
  GetBalanceParams,
  GetTxParams,
  GetTxStatusParams,
  GetUTXOsParams,
  ImportParams,
  ImportKeyParams,
  ListAddressesParams,
  MintParams,
  SendMultipleParams,
  SOutputsParams,
  GetUTXOsResponse,
  GetAssetDescriptionResponse,
  GetBalanceResponse,
  SendParams,
  SendResponse,
  SendMultipleResponse,
  GetAddressTxsParams,
  GetAddressTxsResponse,
  CreateNFTAssetParams,
  SendNFTParams,
  MintNFTParams,
  IMinterSet
} from "./interfaces"
import { IssueTxParams } from "../../common"

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()
const serialization: Serialization = Serialization.getInstance()

/**
 * Class for interacting with a node endpoint that is using the AVM.
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[JRPCAPI]] class. This class should not be directly called. Instead, use the [[Avalanche.addAPI]] function to register this interface with Avalanche.
 */
export class AVMAPI extends JRPCAPI {
  /**
   * @ignore
   */
  protected keychain: KeyChain = new KeyChain("", "")
  protected blockchainID: string = ""
  protected blockchainAlias: string = undefined
  protected AVAXAssetID: Buffer = undefined
  protected txFee: BN = undefined
  protected creationTxFee: BN = undefined
  protected mintTxFee: BN = undefined

  /**
   * Gets the alias for the blockchainID if it exists, otherwise returns `undefined`.
   *
   * @returns The alias for the blockchainID
   */
  getBlockchainAlias = (): string => {
    if (typeof this.blockchainAlias === "undefined") {
      const netid: number = this.core.getNetworkID()
      if (
        netid in Defaults.network &&
        this.blockchainID in Defaults.network[`${netid}`]
      ) {
        this.blockchainAlias =
          Defaults.network[`${netid}`][this.blockchainID]["alias"]
        return this.blockchainAlias
      } else {
        /* istanbul ignore next */
        return undefined
      }
    }
    return this.blockchainAlias
  }

  /**
   * Sets the alias for the blockchainID.
   *
   * @param alias The alias for the blockchainID.
   *
   */
  setBlockchainAlias = (alias: string): undefined => {
    this.blockchainAlias = alias
    /* istanbul ignore next */
    return undefined
  }

  /**
   * Gets the blockchainID and returns it.
   *
   * @returns The blockchainID
   */
  getBlockchainID = (): string => this.blockchainID

  /**
   * Refresh blockchainID, and if a blockchainID is passed in, use that.
   *
   * @param Optional. BlockchainID to assign, if none, uses the default based on networkID.
   *
   * @returns The blockchainID
   */
  refreshBlockchainID = (blockchainID: string = undefined): boolean => {
    const netid: number = this.core.getNetworkID()
    if (
      typeof blockchainID === "undefined" &&
      typeof Defaults.network[`${netid}`] !== "undefined"
    ) {
      this.blockchainID = Defaults.network[`${netid}`].X.blockchainID //default to X-Chain
      return true
    }
    if (typeof blockchainID === "string") {
      this.blockchainID = blockchainID
      return true
    }
    return false
  }

  /**
   * Takes an address string and returns its {@link https://github.com/feross/buffer|Buffer} representation if valid.
   *
   * @returns A {@link https://github.com/feross/buffer|Buffer} for the address if valid, undefined if not valid.
   */
  parseAddress = (addr: string): Buffer => {
    const alias: string = this.getBlockchainAlias()
    const blockchainID: string = this.getBlockchainID()
    return bintools.parseAddress(
      addr,
      blockchainID,
      alias,
      AVMConstants.ADDRESSLENGTH
    )
  }

  addressFromBuffer = (address: Buffer): string => {
    const chainID: string = this.getBlockchainAlias()
      ? this.getBlockchainAlias()
      : this.getBlockchainID()
    const type: SerializedType = "bech32"
    const hrp: string = this.core.getHRP()
    return serialization.bufferToType(address, type, hrp, chainID)
  }

  /**
   * Fetches the AVAX AssetID and returns it in a Promise.
   *
   * @param refresh This function caches the response. Refresh = true will bust the cache.
   *
   * @returns The the provided string representing the AVAX AssetID
   */
  getAVAXAssetID = async (refresh: boolean = false): Promise<Buffer> => {
    if (typeof this.AVAXAssetID === "undefined" || refresh) {
      const asset: GetAVAXAssetIDParams = await this.getAssetDescription(
        PrimaryAssetAlias
      )
      this.AVAXAssetID = asset.assetID
    }
    return this.AVAXAssetID
  }

  /**
   * Overrides the defaults and sets the cache to a specific AVAX AssetID
   *
   * @param avaxAssetID A cb58 string or Buffer representing the AVAX AssetID
   *
   * @returns The the provided string representing the AVAX AssetID
   */
  setAVAXAssetID = (avaxAssetID: string | Buffer) => {
    if (typeof avaxAssetID === "string") {
      avaxAssetID = bintools.cb58Decode(avaxAssetID)
    }
    this.AVAXAssetID = avaxAssetID
  }

  /**
   * Gets the default tx fee for this chain.
   *
   * @returns The default tx fee as a {@link https://github.com/indutny/bn.js/|BN}
   */
  getDefaultTxFee = (): BN => {
    return this.core.getNetworkID() in Defaults.network
      ? new BN(Defaults.network[this.core.getNetworkID()]["X"]["txFee"])
      : new BN(0)
  }

  /**
   * Gets the tx fee for this chain.
   *
   * @returns The tx fee as a {@link https://github.com/indutny/bn.js/|BN}
   */
  getTxFee = (): BN => {
    if (typeof this.txFee === "undefined") {
      this.txFee = this.getDefaultTxFee()
    }
    return this.txFee
  }

  /**
   * Sets the tx fee for this chain.
   *
   * @param fee The tx fee amount to set as {@link https://github.com/indutny/bn.js/|BN}
   */
  setTxFee = (fee: BN): void => {
    this.txFee = fee
  }

  /**
   * Gets the default creation fee for this chain.
   *
   * @returns The default creation fee as a {@link https://github.com/indutny/bn.js/|BN}
   */
  getDefaultCreationTxFee = (): BN => {
    return this.core.getNetworkID() in Defaults.network
      ? new BN(Defaults.network[this.core.getNetworkID()]["X"]["creationTxFee"])
      : new BN(0)
  }

  /**
   * Gets the default mint fee for this chain.
   *
   * @returns The default mint fee as a {@link https://github.com/indutny/bn.js/|BN}
   */
  getDefaultMintTxFee = (): BN => {
    return this.core.getNetworkID() in Defaults.network
      ? new BN(Defaults.network[this.core.getNetworkID()]["X"]["mintTxFee"])
      : new BN(0)
  }

  /**
   * Gets the mint fee for this chain.
   *
   * @returns The mint fee as a {@link https://github.com/indutny/bn.js/|BN}
   */
  getMintTxFee = (): BN => {
    if (typeof this.mintTxFee === "undefined") {
      this.mintTxFee = this.getDefaultMintTxFee()
    }
    return this.mintTxFee
  }

  /**
   * Gets the creation fee for this chain.
   *
   * @returns The creation fee as a {@link https://github.com/indutny/bn.js/|BN}
   */
  getCreationTxFee = (): BN => {
    if (typeof this.creationTxFee === "undefined") {
      this.creationTxFee = this.getDefaultCreationTxFee()
    }
    return this.creationTxFee
  }

  /**
   * Sets the mint fee for this chain.
   *
   * @param fee The mint fee amount to set as {@link https://github.com/indutny/bn.js/|BN}
   */
  setMintTxFee = (fee: BN): void => {
    this.mintTxFee = fee
  }

  /**
   * Sets the creation fee for this chain.
   *
   * @param fee The creation fee amount to set as {@link https://github.com/indutny/bn.js/|BN}
   */
  setCreationTxFee = (fee: BN): void => {
    this.creationTxFee = fee
  }

  /**
   * Gets a reference to the keychain for this class.
   *
   * @returns The instance of [[KeyChain]] for this class
   */
  keyChain = (): KeyChain => this.keychain

  /**
   * @ignore
   */
  newKeyChain = (): KeyChain => {
    // warning, overwrites the old keychain
    const alias: string = this.getBlockchainAlias()
    if (alias) {
      this.keychain = new KeyChain(this.core.getHRP(), alias)
    } else {
      this.keychain = new KeyChain(this.core.getHRP(), this.blockchainID)
    }
    return this.keychain
  }

  /**
   * Helper function which determines if a tx is a goose egg transaction.
   *
   * @param utx An UnsignedTx
   *
   * @returns boolean true if passes goose egg test and false if fails.
   *
   * @remarks
   * A "Goose Egg Transaction" is when the fee far exceeds a reasonable amount
   */
  checkGooseEgg = async (
    utx: UnsignedTx,
    outTotal: BN = new BN(0)
  ): Promise<boolean> => {
    const avaxAssetID: Buffer = await this.getAVAXAssetID()
    const outputTotal: BN = outTotal.gt(new BN(0))
      ? outTotal
      : utx.getOutputTotal(avaxAssetID)
    const fee: BN = utx.getBurn(avaxAssetID)
    if (fee.lte(ONEAVAX.mul(new BN(10))) || fee.lte(outputTotal)) {
      return true
    } else {
      return false
    }
  }

  /**
   * Gets the balance of a particular asset on a blockchain.
   *
   * @param address The address to pull the asset balance from
   * @param assetID The assetID to pull the balance from
   * @param includePartial If includePartial=false, returns only the balance held solely
   *
   * @returns Promise with the balance of the assetID as a {@link https://github.com/indutny/bn.js/|BN} on the provided address for the blockchain.
   */
  getBalance = async (
    address: string,
    assetID: string,
    includePartial: boolean = false
  ): Promise<GetBalanceResponse> => {
    if (typeof this.parseAddress(address) === "undefined") {
      /* istanbul ignore next */
      throw new AddressError(
        "Error - AVMAPI.getBalance: Invalid address format"
      )
    }
    const params: GetBalanceParams = {
      address,
      assetID,
      includePartial
    }
    const response: RequestResponseData = await this.callMethod(
      "avm.getBalance",
      params
    )
    return response.data.result
  }

  /**
   * Creates an address (and associated private keys) on a user on a blockchain.
   *
   * @param username Name of the user to create the address under
   * @param password Password to unlock the user and encrypt the private key
   *
   * @returns Promise for a string representing the address created by the vm.
   */
  createAddress = async (
    username: string,
    password: string
  ): Promise<string> => {
    const params: CreateAddressParams = {
      username,
      password
    }
    const response: RequestResponseData = await this.callMethod(
      "avm.createAddress",
      params
    )
    return response.data.result.address
  }

  /**
   * Create a new fixed-cap, fungible asset. A quantity of it is created at initialization and there no more is ever created.
   *
   * @param username The user paying the transaction fee (in $AVAX) for asset creation
   * @param password The password for the user paying the transaction fee (in $AVAX) for asset creation
   * @param name The human-readable name for the asset
   * @param symbol Optional. The shorthand symbol for the asset. Between 0 and 4 characters
   * @param denomination Optional. Determines how balances of this asset are displayed by user interfaces. Default is 0
   * @param initialHolders An array of objects containing the field "address" and "amount" to establish the genesis values for the new asset
   *
   * ```js
   * Example initialHolders:
   * [
   *   {
   *     "address": "X-avax1kj06lhgx84h39snsljcey3tpc046ze68mek3g5",
   *     "amount": 10000
   *   },
   *   {
   *     "address": "X-avax1am4w6hfrvmh3akduzkjthrtgtqafalce6an8cr",
   *     "amount": 50000
   *   }
   * ]
   * ```
   *
   * @returns Returns a Promise string containing the base 58 string representation of the ID of the newly created asset.
   */
  createFixedCapAsset = async (
    username: string,
    password: string,
    name: string,
    symbol: string,
    denomination: number,
    initialHolders: object[]
  ): Promise<string> => {
    const params: CreateFixedCapAssetParams = {
      name,
      symbol,
      denomination,
      username,
      password,
      initialHolders
    }
    const response: RequestResponseData = await this.callMethod(
      "avm.createFixedCapAsset",
      params
    )
    return response.data.result.assetID
  }

  /**
   * Create a new variable-cap, fungible asset. No units of the asset exist at initialization. Minters can mint units of this asset using createMintTx, signMintTx and sendMintTx.
   *
   * @param username The user paying the transaction fee (in $AVAX) for asset creation
   * @param password The password for the user paying the transaction fee (in $AVAX) for asset creation
   * @param name The human-readable name for the asset
   * @param symbol Optional. The shorthand symbol for the asset -- between 0 and 4 characters
   * @param denomination Optional. Determines how balances of this asset are displayed by user interfaces. Default is 0
   * @param minterSets is a list where each element specifies that threshold of the addresses in minters may together mint more of the asset by signing a minting transaction
   *
   * ```js
   * Example minterSets:
   * [
   *    {
   *      "minters":[
   *        "X-avax1am4w6hfrvmh3akduzkjthrtgtqafalce6an8cr"
   *      ],
   *      "threshold": 1
   *     },
   *     {
   *      "minters": [
   *        "X-avax1am4w6hfrvmh3akduzkjthrtgtqafalce6an8cr",
   *        "X-avax1kj06lhgx84h39snsljcey3tpc046ze68mek3g5",
   *        "X-avax1yell3e4nln0m39cfpdhgqprsd87jkh4qnakklx"
   *      ],
   *      "threshold": 2
   *     }
   * ]
   * ```
   *
   * @returns Returns a Promise string containing the base 58 string representation of the ID of the newly created asset.
   */
  createVariableCapAsset = async (
    username: string,
    password: string,
    name: string,
    symbol: string,
    denomination: number,
    minterSets: object[]
  ): Promise<string> => {
    const params: CreateVariableCapAssetParams = {
      name,
      symbol,
      denomination,
      username,
      password,
      minterSets
    }
    const response: RequestResponseData = await this.callMethod(
      "avm.createVariableCapAsset",
      params
    )
    return response.data.result.assetID
  }

  /**
   * Creates a family of NFT Asset. No units of the asset exist at initialization. Minters can mint units of this asset using createMintTx, signMintTx and sendMintTx.
   *
   * @param username The user paying the transaction fee (in $AVAX) for asset creation
   * @param password The password for the user paying the transaction fee (in $AVAX) for asset creation
   * @param from Optional. An array of addresses managed by the node's keystore for this blockchain which will fund this transaction
   * @param changeAddr Optional. An address to send the change
   * @param name The human-readable name for the asset
   * @param symbol Optional. The shorthand symbol for the asset -- between 0 and 4 characters
   * @param minterSets is a list where each element specifies that threshold of the addresses in minters may together mint more of the asset by signing a minting transaction
   *
   * @returns Returns a Promise string containing the base 58 string representation of the ID of the newly created asset.
   */
  createNFTAsset = async (
    username: string,
    password: string,
    from: string[] | Buffer[] = undefined,
    changeAddr: string,
    name: string,
    symbol: string,
    minterSet: IMinterSet
  ): Promise<string> => {
    const params: CreateNFTAssetParams = {
      username,
      password,
      name,
      symbol,
      minterSet
    }

    const caller: string = "createNFTAsset"
    from = this._cleanAddressArray(from, caller)
    if (typeof from !== "undefined") {
      params["from"] = from
    }

    if (typeof changeAddr !== "undefined") {
      if (typeof this.parseAddress(changeAddr) === "undefined") {
        /* istanbul ignore next */
        throw new AddressError(
          "Error - AVMAPI.createNFTAsset: Invalid address format"
        )
      }
      params["changeAddr"] = changeAddr
    }

    const response: RequestResponseData = await this.callMethod(
      "avm.createNFTAsset",
      params
    )
    return response.data.result.assetID
  }

  /**
   * Create an unsigned transaction to mint more of an asset.
   *
   * @param amount The units of the asset to mint
   * @param assetID The ID of the asset to mint
   * @param to The address to assign the units of the minted asset
   * @param minters Addresses of the minters responsible for signing the transaction
   *
   * @returns Returns a Promise string containing the base 58 string representation of the unsigned transaction.
   */
  mint = async (
    username: string,
    password: string,
    amount: number | BN,
    assetID: Buffer | string,
    to: string,
    minters: string[]
  ): Promise<string> => {
    let asset: string
    let amnt: BN
    if (typeof assetID !== "string") {
      asset = bintools.cb58Encode(assetID)
    } else {
      asset = assetID
    }
    if (typeof amount === "number") {
      amnt = new BN(amount)
    } else {
      amnt = amount
    }
    const params: MintParams = {
      username: username,
      password: password,
      amount: amnt,
      assetID: asset,
      to,
      minters
    }
    const response: RequestResponseData = await this.callMethod(
      "avm.mint",
      params
    )
    return response.data.result.txID
  }

  /**
   * Mint non-fungible tokens which were created with AVMAPI.createNFTAsset
   *
   * @param username The user paying the transaction fee (in $AVAX) for asset creation
   * @param password The password for the user paying the transaction fee (in $AVAX) for asset creation
   * @param from Optional. An array of addresses managed by the node's keystore for this blockchain which will fund this transaction
   * @param changeAddr Optional. An address to send the change
   * @param assetID The asset id which is being sent
   * @param to Address on X-Chain of the account to which this NFT is being sent
   * @param encoding Optional.  is the encoding format to use for the payload argument. Can be either "cb58" or "hex". Defaults to "hex".
   *
   * @returns ID of the transaction
   */
  mintNFT = async (
    username: string,
    password: string,
    from: string[] | Buffer[] = undefined,
    changeAddr: string = undefined,
    payload: string,
    assetID: string | Buffer,
    to: string,
    encoding: string = "hex"
  ): Promise<string> => {
    let asset: string

    if (typeof this.parseAddress(to) === "undefined") {
      /* istanbul ignore next */
      throw new AddressError("Error - AVMAPI.mintNFT: Invalid address format")
    }

    if (typeof assetID !== "string") {
      asset = bintools.cb58Encode(assetID)
    } else {
      asset = assetID
    }

    const params: MintNFTParams = {
      username,
      password,
      assetID: asset,
      payload,
      to,
      encoding
    }

    const caller: string = "mintNFT"
    from = this._cleanAddressArray(from, caller)
    if (typeof from !== "undefined") {
      params["from"] = from
    }

    if (typeof changeAddr !== "undefined") {
      if (typeof this.parseAddress(changeAddr) === "undefined") {
        /* istanbul ignore next */
        throw new AddressError("Error - AVMAPI.mintNFT: Invalid address format")
      }
      params["changeAddr"] = changeAddr
    }

    const response: RequestResponseData = await this.callMethod(
      "avm.mintNFT",
      params
    )
    return response.data.result.txID
  }

  /**
   * Send NFT from one account to another on X-Chain
   *
   * @param username The user paying the transaction fee (in $AVAX) for asset creation
   * @param password The password for the user paying the transaction fee (in $AVAX) for asset creation
   * @param from Optional. An array of addresses managed by the node's keystore for this blockchain which will fund this transaction
   * @param changeAddr Optional. An address to send the change
   * @param assetID The asset id which is being sent
   * @param groupID The group this NFT is issued to.
   * @param to Address on X-Chain of the account to which this NFT is being sent
   *
   * @returns ID of the transaction
   */
  sendNFT = async (
    username: string,
    password: string,
    from: string[] | Buffer[] = undefined,
    changeAddr: string = undefined,
    assetID: string | Buffer,
    groupID: number,
    to: string
  ): Promise<string> => {
    let asset: string

    if (typeof this.parseAddress(to) === "undefined") {
      /* istanbul ignore next */
      throw new AddressError("Error - AVMAPI.sendNFT: Invalid address format")
    }

    if (typeof assetID !== "string") {
      asset = bintools.cb58Encode(assetID)
    } else {
      asset = assetID
    }

    const params: SendNFTParams = {
      username,
      password,
      assetID: asset,
      groupID,
      to
    }

    const caller: string = "sendNFT"
    from = this._cleanAddressArray(from, caller)
    if (typeof from !== "undefined") {
      params["from"] = from
    }

    if (typeof changeAddr !== "undefined") {
      if (typeof this.parseAddress(changeAddr) === "undefined") {
        /* istanbul ignore next */
        throw new AddressError("Error - AVMAPI.sendNFT: Invalid address format")
      }
      params["changeAddr"] = changeAddr
    }

    const response: RequestResponseData = await this.callMethod(
      "avm.sendNFT",
      params
    )
    return response.data.result.txID
  }

  /**
   * Exports the private key for an address.
   *
   * @param username The name of the user with the private key
   * @param password The password used to decrypt the private key
   * @param address The address whose private key should be exported
   *
   * @returns Promise with the decrypted private key as store in the database
   */
  exportKey = async (
    username: string,
    password: string,
    address: string
  ): Promise<string> => {
    if (typeof this.parseAddress(address) === "undefined") {
      /* istanbul ignore next */
      throw new AddressError("Error - AVMAPI.exportKey: Invalid address format")
    }
    const params: ExportKeyParams = {
      username,
      password,
      address
    }
    const response: RequestResponseData = await this.callMethod(
      "avm.exportKey",
      params
    )
    return response.data.result.privateKey
  }

  /**
   * Imports a private key into the node's keystore under an user and for a blockchain.
   *
   * @param username The name of the user to store the private key
   * @param password The password that unlocks the user
   * @param privateKey A string representing the private key in the vm's format
   *
   * @returns The address for the imported private key.
   */
  importKey = async (
    username: string,
    password: string,
    privateKey: string
  ): Promise<string> => {
    const params: ImportKeyParams = {
      username,
      password,
      privateKey
    }
    const response: RequestResponseData = await this.callMethod(
      "avm.importKey",
      params
    )
    return response.data.result.address
  }

  /**
   * Send ANT (Avalanche Native Token) assets including AVAX from the X-Chain to an account on the P-Chain or C-Chain.
   *
   * After calling this method, you must call the P-Chain's `import` or the C-Chain’s `import` method to complete the transfer.
   *
   * @param username The Keystore user that controls the P-Chain or C-Chain account specified in `to`
   * @param password The password of the Keystore user
   * @param to The account on the P-Chain or C-Chain to send the asset to.
   * @param amount Amount of asset to export as a {@link https://github.com/indutny/bn.js/|BN}
   * @param assetID The asset id which is being sent
   *
   * @returns String representing the transaction id
   */
  export = async (
    username: string,
    password: string,
    to: string,
    amount: BN,
    assetID: string
  ): Promise<string> => {
    const params: ExportParams = {
      username,
      password,
      to,
      amount: amount,
      assetID
    }
    const response: RequestResponseData = await this.callMethod(
      "avm.export",
      params
    )
    return response.data.result.txID
  }

  /**
   * Send ANT (Avalanche Native Token) assets including AVAX from an account on the P-Chain or C-Chain to an address on the X-Chain. This transaction
   * must be signed with the key of the account that the asset is sent from and which pays
   * the transaction fee.
   *
   * @param username The Keystore user that controls the account specified in `to`
   * @param password The password of the Keystore user
   * @param to The address of the account the asset is sent to.
   * @param sourceChain The chainID where the funds are coming from. Ex: "C"
   *
   * @returns Promise for a string for the transaction, which should be sent to the network
   * by calling issueTx.
   */
  import = async (
    username: string,
    password: string,
    to: string,
    sourceChain: string
  ): Promise<string> => {
    const params: ImportParams = {
      username,
      password,
      to,
      sourceChain
    }
    const response: RequestResponseData = await this.callMethod(
      "avm.import",
      params
    )
    return response.data.result.txID
  }

  /**
   * Lists all the addresses under a user.
   *
   * @param username The user to list addresses
   * @param password The password of the user to list the addresses
   *
   * @returns Promise of an array of address strings in the format specified by the blockchain.
   */
  listAddresses = async (
    username: string,
    password: string
  ): Promise<string[]> => {
    const params: ListAddressesParams = {
      username,
      password
    }
    const response: RequestResponseData = await this.callMethod(
      "avm.listAddresses",
      params
    )
    return response.data.result.addresses
  }

  /**
   * Retrieves all assets for an address on a server and their associated balances.
   *
   * @param address The address to get a list of assets
   *
   * @returns Promise of an object mapping assetID strings with {@link https://github.com/indutny/bn.js/|BN} balance for the address on the blockchain.
   */
  getAllBalances = async (address: string): Promise<object[]> => {
    if (typeof this.parseAddress(address) === "undefined") {
      /* istanbul ignore next */
      throw new AddressError(
        "Error - AVMAPI.getAllBalances: Invalid address format"
      )
    }
    const params: GetAllBalancesParams = {
      address
    }
    const response: RequestResponseData = await this.callMethod(
      "avm.getAllBalances",
      params
    )
    return response.data.result.balances
  }

  /**
   * Retrieves an assets name and symbol.
   *
   * @param assetID Either a {@link https://github.com/feross/buffer|Buffer} or an b58 serialized string for the AssetID or its alias.
   *
   * @returns Returns a Promise object with keys "name" and "symbol".
   */
  getAssetDescription = async (
    assetID: Buffer | string
  ): Promise<GetAssetDescriptionResponse> => {
    let asset: string
    if (typeof assetID !== "string") {
      asset = bintools.cb58Encode(assetID)
    } else {
      asset = assetID
    }
    const params: GetAssetDescriptionParams = {
      assetID: asset
    }
    const response: RequestResponseData = await this.callMethod(
      "avm.getAssetDescription",
      params
    )
    return {
      name: response.data.result.name,
      symbol: response.data.result.symbol,
      assetID: bintools.cb58Decode(response.data.result.assetID),
      denomination: parseInt(response.data.result.denomination, 10)
    }
  }

  /**
   * Returns the transaction data of a provided transaction ID by calling the node's `getTx` method.
   *
   * @param txID The string representation of the transaction ID
   * @param encoding sets the format of the returned transaction. Can be, "cb58", "hex" or "json". Defaults to "cb58".
   *
   * @returns Returns a Promise string or object containing the bytes retrieved from the node
   */
  getTx = async (
    txID: string,
    encoding: string = "hex"
  ): Promise<string | object> => {
    const params: GetTxParams = {
      txID,
      encoding
    }
    const response: RequestResponseData = await this.callMethod(
      "avm.getTx",
      params
    )
    return response.data.result.tx
  }

  /**
   * Returns the status of a provided transaction ID by calling the node's `getTxStatus` method.
   *
   * @param txID The string representation of the transaction ID
   *
   * @returns Returns a Promise string containing the status retrieved from the node
   */
  getTxStatus = async (txID: string): Promise<string> => {
    const params: GetTxStatusParams = {
      txID
    }
    const response: RequestResponseData = await this.callMethod(
      "avm.getTxStatus",
      params
    )
    return response.data.result.status
  }

  /**
   * Retrieves the UTXOs related to the addresses provided from the node's `getUTXOs` method.
   *
   * @param addresses An array of addresses as cb58 strings or addresses as {@link https://github.com/feross/buffer|Buffer}s
   * @param sourceChain A string for the chain to look for the UTXO's. Default is to use this chain, but if exported UTXOs exist from other chains, this can used to pull them instead.
   * @param limit Optional. Returns at most [limit] addresses. If [limit] == 0 or > [maxUTXOsToFetch], fetches up to [maxUTXOsToFetch].
   * @param startIndex Optional. [StartIndex] defines where to start fetching UTXOs (for pagination.)
   * UTXOs fetched are from addresses equal to or greater than [StartIndex.Address]
   * For address [StartIndex.Address], only UTXOs with IDs greater than [StartIndex.Utxo] will be returned.
   * @param persistOpts Options available to persist these UTXOs in local storage
   *
   * @remarks
   * persistOpts is optional and must be of type [[PersistanceOptions]]
   *
   */
  getUTXOs = async (
    addresses: string[] | string,
    sourceChain: string = undefined,
    limit: number = 0,
    startIndex: { address: string; utxo: string } = undefined,
    persistOpts: PersistanceOptions = undefined,
    encoding: string = "hex"
  ): Promise<GetUTXOsResponse> => {
    if (typeof addresses === "string") {
      addresses = [addresses]
    }

    const params: GetUTXOsParams = {
      addresses: addresses,
      limit,
      encoding
    }
    if (typeof startIndex !== "undefined" && startIndex) {
      params.startIndex = startIndex
    }

    if (typeof sourceChain !== "undefined") {
      params.sourceChain = sourceChain
    }

    const response: RequestResponseData = await this.callMethod(
      "avm.getUTXOs",
      params
    )
    const utxos: UTXOSet = new UTXOSet()
    let data = response.data.result.utxos
    if (persistOpts && typeof persistOpts === "object") {
      if (this.db.has(persistOpts.getName())) {
        const selfArray: string[] = this.db.get(persistOpts.getName())
        if (Array.isArray(selfArray)) {
          utxos.addArray(data)
          const utxoSet: UTXOSet = new UTXOSet()
          utxoSet.addArray(selfArray)
          utxoSet.mergeByRule(utxos, persistOpts.getMergeRule())
          data = utxoSet.getAllUTXOStrings()
        }
      }
      this.db.set(persistOpts.getName(), data, persistOpts.getOverwrite())
    }
    if (data.length > 0 && data[0].substring(0, 2) === "0x") {
      const cb58Strs: string[] = []
      data.forEach((str: string): void => {
        cb58Strs.push(bintools.cb58Encode(new Buffer(str.slice(2), "hex")))
      })

      utxos.addArray(cb58Strs, false)
    } else {
      utxos.addArray(data, false)
    }
    response.data.result.utxos = utxos
    return response.data.result
  }

  /**
   * Helper function which creates an unsigned transaction. For more granular control, you may create your own
   * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
   *
   * @param utxoset A set of UTXOs that the transaction is built on
   * @param amount The amount of AssetID to be spent in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}.
   * @param assetID The assetID of the value being sent
   * @param toAddresses The addresses to send the funds
   * @param fromAddresses The addresses being used to send the funds from the UTXOs provided
   * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
   * @param memo Optional CB58 Buffer or String which contains arbitrary bytes, up to 256 bytes
   * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
   * @param locktime Optional. The locktime field created in the resulting outputs
   * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
   *
   * @returns An unsigned transaction ([[UnsignedTx]]) which contains a [[BaseTx]].
   *
   * @remarks
   * This helper exists because the endpoint API should be the primary point of entry for most functionality.
   */
  buildBaseTx = async (
    utxoset: UTXOSet,
    amount: BN,
    assetID: Buffer | string = undefined,
    toAddresses: string[],
    fromAddresses: string[],
    changeAddresses: string[],
    memo: PayloadBase | Buffer = undefined,
    asOf: BN = UnixNow(),
    locktime: BN = new BN(0),
    threshold: number = 1
  ): Promise<UnsignedTx> => {
    const caller: string = "buildBaseTx"
    const to: Buffer[] = this._cleanAddressArray(toAddresses, caller).map(
      (a: string): Buffer => bintools.stringToAddress(a)
    )
    const from: Buffer[] = this._cleanAddressArray(fromAddresses, caller).map(
      (a: string): Buffer => bintools.stringToAddress(a)
    )
    const change: Buffer[] = this._cleanAddressArray(
      changeAddresses,
      caller
    ).map((a: string): Buffer => bintools.stringToAddress(a))

    if (typeof assetID === "string") {
      assetID = bintools.cb58Decode(assetID)
    }

    if (memo instanceof PayloadBase) {
      memo = memo.getPayload()
    }

    const networkID: number = this.core.getNetworkID()
    const blockchainIDBuf: Buffer = bintools.cb58Decode(this.blockchainID)
    const fee: BN = this.getTxFee()
    const feeAssetID: Buffer = await this.getAVAXAssetID()
    const builtUnsignedTx: UnsignedTx = utxoset.buildBaseTx(
      networkID,
      blockchainIDBuf,
      amount,
      assetID,
      to,
      from,
      change,
      fee,
      feeAssetID,
      memo,
      asOf,
      locktime,
      threshold
    )

    if (!(await this.checkGooseEgg(builtUnsignedTx))) {
      /* istanbul ignore next */
      throw new GooseEggCheckError(
        "Error - AVMAPI.buildBaseTx:Failed Goose Egg Check"
      )
    }

    return builtUnsignedTx
  }

  /**
   * Helper function which creates an unsigned NFT Transfer. For more granular control, you may create your own
   * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
   *
   * @param utxoset  A set of UTXOs that the transaction is built on
   * @param toAddresses The addresses to send the NFT
   * @param fromAddresses The addresses being used to send the NFT from the utxoID provided
   * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
   * @param utxoid A base58 utxoID or an array of base58 utxoIDs for the nfts this transaction is sending
   * @param memo Optional CB58 Buffer or String which contains arbitrary bytes, up to 256 bytes
   * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
   * @param locktime Optional. The locktime field created in the resulting outputs
   * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
   *
   * @returns An unsigned transaction ([[UnsignedTx]]) which contains a [[NFTTransferTx]].
   *
   * @remarks
   * This helper exists because the endpoint API should be the primary point of entry for most functionality.
   */
  buildNFTTransferTx = async (
    utxoset: UTXOSet,
    toAddresses: string[],
    fromAddresses: string[],
    changeAddresses: string[],
    utxoid: string | string[],
    memo: PayloadBase | Buffer = undefined,
    asOf: BN = UnixNow(),
    locktime: BN = new BN(0),
    threshold: number = 1
  ): Promise<UnsignedTx> => {
    const caller: string = "buildNFTTransferTx"
    const to: Buffer[] = this._cleanAddressArray(toAddresses, caller).map(
      (a: string): Buffer => bintools.stringToAddress(a)
    )
    const from: Buffer[] = this._cleanAddressArray(fromAddresses, caller).map(
      (a: string): Buffer => bintools.stringToAddress(a)
    )
    const change: Buffer[] = this._cleanAddressArray(
      changeAddresses,
      caller
    ).map((a: string): Buffer => bintools.stringToAddress(a))

    if (memo instanceof PayloadBase) {
      memo = memo.getPayload()
    }
    const avaxAssetID: Buffer = await this.getAVAXAssetID()

    let utxoidArray: string[] = []
    if (typeof utxoid === "string") {
      utxoidArray = [utxoid]
    } else if (Array.isArray(utxoid)) {
      utxoidArray = utxoid
    }

    const builtUnsignedTx: UnsignedTx = utxoset.buildNFTTransferTx(
      this.core.getNetworkID(),
      bintools.cb58Decode(this.blockchainID),
      to,
      from,
      change,
      utxoidArray,
      this.getTxFee(),
      avaxAssetID,
      memo,
      asOf,
      locktime,
      threshold
    )

    if (!(await this.checkGooseEgg(builtUnsignedTx))) {
      /* istanbul ignore next */
      throw new GooseEggCheckError(
        "Error - AVMAPI.buildNFTTransferTx:Failed Goose Egg Check"
      )
    }

    return builtUnsignedTx
  }

  /**
   * Helper function which creates an unsigned Import Tx. For more granular control, you may create your own
   * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
   *
   * @param utxoset  A set of UTXOs that the transaction is built on
   * @param ownerAddresses The addresses being used to import
   * @param sourceChain The chainid for where the import is coming from
   * @param toAddresses The addresses to send the funds
   * @param fromAddresses The addresses being used to send the funds from the UTXOs provided
   * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
   * @param memo Optional CB58 Buffer or String which contains arbitrary bytes, up to 256 bytes
   * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
   * @param locktime Optional. The locktime field created in the resulting outputs
   * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
   *
   * @returns An unsigned transaction ([[UnsignedTx]]) which contains a [[ImportTx]].
   *
   * @remarks
   * This helper exists because the endpoint API should be the primary point of entry for most functionality.
   */
  buildImportTx = async (
    utxoset: UTXOSet,
    ownerAddresses: string[],
    sourceChain: Buffer | string,
    toAddresses: string[],
    fromAddresses: string[],
    changeAddresses: string[] = undefined,
    memo: PayloadBase | Buffer = undefined,
    asOf: BN = UnixNow(),
    locktime: BN = new BN(0),
    threshold: number = 1
  ): Promise<UnsignedTx> => {
    const caller: string = "buildImportTx"
    const to: Buffer[] = this._cleanAddressArray(toAddresses, caller).map(
      (a: string): Buffer => bintools.stringToAddress(a)
    )
    const from: Buffer[] = this._cleanAddressArray(fromAddresses, caller).map(
      (a: string): Buffer => bintools.stringToAddress(a)
    )
    const change: Buffer[] = this._cleanAddressArray(
      changeAddresses,
      caller
    ).map((a: string): Buffer => bintools.stringToAddress(a))

    let srcChain: string = undefined

    if (typeof sourceChain === "undefined") {
      throw new ChainIdError(
        "Error - AVMAPI.buildImportTx: Source ChainID is undefined."
      )
    } else if (typeof sourceChain === "string") {
      srcChain = sourceChain
      sourceChain = bintools.cb58Decode(sourceChain)
    } else if (!(sourceChain instanceof Buffer)) {
      throw new ChainIdError(
        "Error - AVMAPI.buildImportTx: Invalid destinationChain type: " +
          typeof sourceChain
      )
    }

    const atomicUTXOs: UTXOSet = (
      await this.getUTXOs(ownerAddresses, srcChain, 0, undefined)
    ).utxos
    const avaxAssetID: Buffer = await this.getAVAXAssetID()
    const atomics: UTXO[] = atomicUTXOs.getAllUTXOs()

    if (atomics.length === 0) {
      throw new NoAtomicUTXOsError(
        "Error - AVMAPI.buildImportTx: No atomic UTXOs to import from " +
          srcChain +
          " using addresses: " +
          ownerAddresses.join(", ")
      )
    }

    if (memo instanceof PayloadBase) {
      memo = memo.getPayload()
    }

    const builtUnsignedTx: UnsignedTx = utxoset.buildImportTx(
      this.core.getNetworkID(),
      bintools.cb58Decode(this.blockchainID),
      to,
      from,
      change,
      atomics,
      sourceChain,
      this.getTxFee(),
      avaxAssetID,
      memo,
      asOf,
      locktime,
      threshold
    )

    if (!(await this.checkGooseEgg(builtUnsignedTx))) {
      /* istanbul ignore next */
      throw new GooseEggCheckError(
        "Error - AVMAPI.buildImportTx:Failed Goose Egg Check"
      )
    }

    return builtUnsignedTx
  }

  /**
   * Helper function which creates an unsigned Export Tx. For more granular control, you may create your own
   * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
   *
   * @param utxoset A set of UTXOs that the transaction is built on
   * @param amount The amount being exported as a {@link https://github.com/indutny/bn.js/|BN}
   * @param destinationChain The chainid for where the assets will be sent.
   * @param toAddresses The addresses to send the funds
   * @param fromAddresses The addresses being used to send the funds from the UTXOs provided
   * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
   * @param memo Optional CB58 Buffer or String which contains arbitrary bytes, up to 256 bytes
   * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
   * @param locktime Optional. The locktime field created in the resulting outputs
   * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
   * @param assetID Optional. The assetID of the asset to send. Defaults to AVAX assetID.
   * Regardless of the asset which you"re exporting, all fees are paid in AVAX.
   *
   * @returns An unsigned transaction ([[UnsignedTx]]) which contains an [[ExportTx]].
   */
  buildExportTx = async (
    utxoset: UTXOSet,
    amount: BN,
    destinationChain: Buffer | string,
    toAddresses: string[],
    fromAddresses: string[],
    changeAddresses: string[] = undefined,
    memo: PayloadBase | Buffer = undefined,
    asOf: BN = UnixNow(),
    locktime: BN = new BN(0),
    threshold: number = 1,
    assetID: string = undefined
  ): Promise<UnsignedTx> => {
    const prefixes: object = {}
    toAddresses.map((a: string): void => {
      prefixes[a.split("-")[0]] = true
    })
    if (Object.keys(prefixes).length !== 1) {
      throw new AddressError(
        "Error - AVMAPI.buildExportTx: To addresses must have the same chainID prefix."
      )
    }

    if (typeof destinationChain === "undefined") {
      throw new ChainIdError(
        "Error - AVMAPI.buildExportTx: Destination ChainID is undefined."
      )
    } else if (typeof destinationChain === "string") {
      destinationChain = bintools.cb58Decode(destinationChain) //
    } else if (!(destinationChain instanceof Buffer)) {
      throw new ChainIdError(
        "Error - AVMAPI.buildExportTx: Invalid destinationChain type: " +
          typeof destinationChain
      )
    }
    if (destinationChain.length !== 32) {
      throw new ChainIdError(
        "Error - AVMAPI.buildExportTx: Destination ChainID must be 32 bytes in length."
      )
    }

    const to: Buffer[] = []
    toAddresses.map((a: string): void => {
      to.push(bintools.stringToAddress(a))
    })

    const caller: string = "buildExportTx"
    const from: Buffer[] = this._cleanAddressArray(fromAddresses, caller).map(
      (a: string): Buffer => bintools.stringToAddress(a)
    )

    const change: Buffer[] = this._cleanAddressArray(
      changeAddresses,
      caller
    ).map((a: string): Buffer => bintools.stringToAddress(a))

    if (memo instanceof PayloadBase) {
      memo = memo.getPayload()
    }

    const avaxAssetID: Buffer = await this.getAVAXAssetID()
    if (typeof assetID === "undefined") {
      assetID = bintools.cb58Encode(avaxAssetID)
    }

    const networkID: number = this.core.getNetworkID()
    const blockchainID: Buffer = bintools.cb58Decode(this.blockchainID)
    const assetIDBuf: Buffer = bintools.cb58Decode(assetID)
    const fee: BN = this.getTxFee()
    const builtUnsignedTx: UnsignedTx = utxoset.buildExportTx(
      networkID,
      blockchainID,
      amount,
      assetIDBuf,
      to,
      from,
      change,
      destinationChain,
      fee,
      avaxAssetID,
      memo,
      asOf,
      locktime,
      threshold
    )

    if (!(await this.checkGooseEgg(builtUnsignedTx))) {
      /* istanbul ignore next */
      throw new GooseEggCheckError(
        "Error - AVMAPI.buildExportTx:Failed Goose Egg Check"
      )
    }

    return builtUnsignedTx
  }

  /**
   * Creates an unsigned transaction. For more granular control, you may create your own
   * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
   *
   * @param utxoset A set of UTXOs that the transaction is built on
   * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
   * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
   * @param initialState The [[InitialStates]] that represent the intial state of a created asset
   * @param name String for the descriptive name of the asset
   * @param symbol String for the ticker symbol of the asset
   * @param denomination Number for the denomination which is 10^D. D must be >= 0 and <= 32. Ex: $1 AVAX = 10^9 $nAVAX
   * @param mintOutputs Optional. Array of [[SECPMintOutput]]s to be included in the transaction. These outputs can be spent to mint more tokens.
   * @param memo Optional CB58 Buffer or String which contains arbitrary bytes, up to 256 bytes
   * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
   *
   * @returns An unsigned transaction ([[UnsignedTx]]) which contains a [[CreateAssetTx]].
   *
   */
  buildCreateAssetTx = async (
    utxoset: UTXOSet,
    fromAddresses: string[],
    changeAddresses: string[],
    initialStates: InitialStates,
    name: string,
    symbol: string,
    denomination: number,
    mintOutputs: SECPMintOutput[] = undefined,
    memo: PayloadBase | Buffer = undefined,
    asOf: BN = UnixNow()
  ): Promise<UnsignedTx> => {
    const caller: string = "buildCreateAssetTx"
    const from: Buffer[] = this._cleanAddressArray(fromAddresses, caller).map(
      (a: string): Buffer => bintools.stringToAddress(a)
    )
    const change: Buffer[] = this._cleanAddressArray(
      changeAddresses,
      caller
    ).map((a: string): Buffer => bintools.stringToAddress(a))

    if (memo instanceof PayloadBase) {
      memo = memo.getPayload()
    }

    if (symbol.length > AVMConstants.SYMBOLMAXLEN) {
      throw new SymbolError(
        "Error - AVMAPI.buildCreateAssetTx: Symbols may not exceed length of " +
          AVMConstants.SYMBOLMAXLEN
      )
    }
    if (name.length > AVMConstants.ASSETNAMELEN) {
      throw new NameError(
        "Error - AVMAPI.buildCreateAssetTx: Names may not exceed length of " +
          AVMConstants.ASSETNAMELEN
      )
    }

    const networkID: number = this.core.getNetworkID()
    const blockchainID: Buffer = bintools.cb58Decode(this.blockchainID)
    const avaxAssetID: Buffer = await this.getAVAXAssetID()
    const fee: BN = this.getDefaultCreationTxFee()
    const builtUnsignedTx: UnsignedTx = utxoset.buildCreateAssetTx(
      networkID,
      blockchainID,
      from,
      change,
      initialStates,
      name,
      symbol,
      denomination,
      mintOutputs,
      fee,
      avaxAssetID,
      memo,
      asOf
    )

    if (!(await this.checkGooseEgg(builtUnsignedTx, fee))) {
      /* istanbul ignore next */
      throw new GooseEggCheckError(
        "Error - AVMAPI.buildCreateAssetTx:Failed Goose Egg Check"
      )
    }

    return builtUnsignedTx
  }

  buildSECPMintTx = async (
    utxoset: UTXOSet,
    mintOwner: SECPMintOutput,
    transferOwner: SECPTransferOutput,
    fromAddresses: string[],
    changeAddresses: string[],
    mintUTXOID: string,
    memo: PayloadBase | Buffer = undefined,
    asOf: BN = UnixNow()
  ): Promise<any> => {
    const caller: string = "buildSECPMintTx"
    const from: Buffer[] = this._cleanAddressArray(fromAddresses, caller).map(
      (a: string): Buffer => bintools.stringToAddress(a)
    )
    const change: Buffer[] = this._cleanAddressArray(
      changeAddresses,
      caller
    ).map((a: string): Buffer => bintools.stringToAddress(a))

    if (memo instanceof PayloadBase) {
      memo = memo.getPayload()
    }

    const networkID: number = this.core.getNetworkID()
    const blockchainID: Buffer = bintools.cb58Decode(this.blockchainID)
    const avaxAssetID: Buffer = await this.getAVAXAssetID()
    const fee: BN = this.getMintTxFee()
    const builtUnsignedTx: UnsignedTx = utxoset.buildSECPMintTx(
      networkID,
      blockchainID,
      mintOwner,
      transferOwner,
      from,
      change,
      mintUTXOID,
      fee,
      avaxAssetID,
      memo,
      asOf
    )
    if (!(await this.checkGooseEgg(builtUnsignedTx))) {
      /* istanbul ignore next */
      throw new GooseEggCheckError(
        "Error - AVMAPI.buildSECPMintTx:Failed Goose Egg Check"
      )
    }
    return builtUnsignedTx
  }

  /**
   * Creates an unsigned transaction. For more granular control, you may create your own
   * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
   *
   * @param utxoset A set of UTXOs that the transaction is built on
   * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
   * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
   * @param minterSets is a list where each element specifies that threshold of the addresses in minters may together mint more of the asset by signing a minting transaction
   * @param name String for the descriptive name of the asset
   * @param symbol String for the ticker symbol of the asset
   * @param memo Optional CB58 Buffer or String which contains arbitrary bytes, up to 256 bytes
   * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
   * @param locktime Optional. The locktime field created in the resulting mint output
   *
   * ```js
   * Example minterSets:
   * [
   *      {
   *          "minters":[
   *              "X-avax1ghstjukrtw8935lryqtnh643xe9a94u3tc75c7"
   *          ],
   *          "threshold": 1
   *      },
   *      {
   *          "minters": [
   *              "X-avax1yell3e4nln0m39cfpdhgqprsd87jkh4qnakklx",
   *              "X-avax1k4nr26c80jaquzm9369j5a4shmwcjn0vmemcjz",
   *              "X-avax1ztkzsrjnkn0cek5ryvhqswdtcg23nhge3nnr5e"
   *          ],
   *          "threshold": 2
   *      }
   * ]
   * ```
   *
   * @returns An unsigned transaction ([[UnsignedTx]]) which contains a [[CreateAssetTx]].
   *
   */
  buildCreateNFTAssetTx = async (
    utxoset: UTXOSet,
    fromAddresses: string[],
    changeAddresses: string[],
    minterSets: MinterSet[],
    name: string,
    symbol: string,
    memo: PayloadBase | Buffer = undefined,
    asOf: BN = UnixNow(),
    locktime: BN = new BN(0)
  ): Promise<UnsignedTx> => {
    const caller: string = "buildCreateNFTAssetTx"
    const from: Buffer[] = this._cleanAddressArray(fromAddresses, caller).map(
      (a: string): Buffer => bintools.stringToAddress(a)
    )
    const change: Buffer[] = this._cleanAddressArray(
      changeAddresses,
      caller
    ).map((a: string): Buffer => bintools.stringToAddress(a))

    if (memo instanceof PayloadBase) {
      memo = memo.getPayload()
    }

    if (name.length > AVMConstants.ASSETNAMELEN) {
      /* istanbul ignore next */
      throw new NameError(
        "Error - AVMAPI.buildCreateNFTAssetTx: Names may not exceed length of " +
          AVMConstants.ASSETNAMELEN
      )
    }
    if (symbol.length > AVMConstants.SYMBOLMAXLEN) {
      /* istanbul ignore next */
      throw new SymbolError(
        "Error - AVMAPI.buildCreateNFTAssetTx: Symbols may not exceed length of " +
          AVMConstants.SYMBOLMAXLEN
      )
    }
    const networkID: number = this.core.getNetworkID()
    const blockchainID: Buffer = bintools.cb58Decode(this.blockchainID)
    const creationTxFee: BN = this.getCreationTxFee()
    const avaxAssetID: Buffer = await this.getAVAXAssetID()
    const builtUnsignedTx: UnsignedTx = utxoset.buildCreateNFTAssetTx(
      networkID,
      blockchainID,
      from,
      change,
      minterSets,
      name,
      symbol,
      creationTxFee,
      avaxAssetID,
      memo,
      asOf,
      locktime
    )
    if (!(await this.checkGooseEgg(builtUnsignedTx, creationTxFee))) {
      /* istanbul ignore next */
      throw new GooseEggCheckError(
        "Error - AVMAPI.buildCreateNFTAssetTx:Failed Goose Egg Check"
      )
    }
    return builtUnsignedTx
  }

  /**
   * Creates an unsigned transaction. For more granular control, you may create your own
   * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
   *
   * @param utxoset  A set of UTXOs that the transaction is built on
   * @param owners Either a single or an array of [[OutputOwners]] to send the nft output
   * @param fromAddresses The addresses being used to send the NFT from the utxoID provided
   * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
   * @param utxoid A base58 utxoID or an array of base58 utxoIDs for the nft mint output this transaction is sending
   * @param groupID Optional. The group this NFT is issued to.
   * @param payload Optional. Data for NFT Payload as either a [[PayloadBase]] or a {@link https://github.com/feross/buffer|Buffer}
   * @param memo Optional CB58 Buffer or String which contains arbitrary bytes, up to 256 bytes
   * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
   *
   * @returns An unsigned transaction ([[UnsignedTx]]) which contains an [[OperationTx]].
   *
   */
  buildCreateNFTMintTx = async (
    utxoset: UTXOSet,
    owners: OutputOwners[] | OutputOwners,
    fromAddresses: string[],
    changeAddresses: string[],
    utxoid: string | string[],
    groupID: number = 0,
    payload: PayloadBase | Buffer = undefined,
    memo: PayloadBase | Buffer = undefined,
    asOf: BN = UnixNow()
  ): Promise<any> => {
    const caller: string = "buildCreateNFTMintTx"
    const from: Buffer[] = this._cleanAddressArray(fromAddresses, caller).map(
      (a: string): Buffer => bintools.stringToAddress(a)
    )
    const change: Buffer[] = this._cleanAddressArray(
      changeAddresses,
      caller
    ).map((a: string): Buffer => bintools.stringToAddress(a))

    if (memo instanceof PayloadBase) {
      memo = memo.getPayload()
    }

    if (payload instanceof PayloadBase) {
      payload = payload.getPayload()
    }

    if (typeof utxoid === "string") {
      utxoid = [utxoid]
    }

    const avaxAssetID: Buffer = await this.getAVAXAssetID()

    if (owners instanceof OutputOwners) {
      owners = [owners]
    }

    const networkID: number = this.core.getNetworkID()
    const blockchainID: Buffer = bintools.cb58Decode(this.blockchainID)
    const txFee: BN = this.getTxFee()
    const builtUnsignedTx: UnsignedTx = utxoset.buildCreateNFTMintTx(
      networkID,
      blockchainID,
      owners,
      from,
      change,
      utxoid,
      groupID,
      payload,
      txFee,
      avaxAssetID,
      memo,
      asOf
    )
    if (!(await this.checkGooseEgg(builtUnsignedTx))) {
      /* istanbul ignore next */
      throw new GooseEggCheckError(
        "Error - AVMAPI.buildCreateNFTMintTx:Failed Goose Egg Check"
      )
    }
    return builtUnsignedTx
  }

  /**
   * Helper function which takes an unsigned transaction and signs it, returning the resulting [[Tx]].
   *
   * @param utx The unsigned transaction of type [[UnsignedTx]]
   *
   * @returns A signed transaction of type [[Tx]]
   */
  signTx = (utx: UnsignedTx): Tx => utx.sign(this.keychain)

  /**
   * Calls the node's issueTx method from the API and returns the resulting transaction ID as a string.
   *
   * @param tx A string, {@link https://github.com/feross/buffer|Buffer}, or [[Tx]] representing a transaction
   *
   * @returns A Promise string representing the transaction ID of the posted transaction.
   */
  issueTx = async (tx: string | Buffer | Tx): Promise<string> => {
    let Transaction = ""
    if (typeof tx === "string") {
      Transaction = tx
    } else if (tx instanceof Buffer) {
      const txobj: Tx = new Tx()
      txobj.fromBuffer(tx)
      Transaction = txobj.toString()
    } else if (tx instanceof Tx) {
      Transaction = tx.toString()
    } else {
      /* istanbul ignore next */
      throw new TransactionError(
        "Error - AVMAPI.issueTx: provided tx is not expected type of string, Buffer, or Tx"
      )
    }
    const params: IssueTxParams = {
      tx: Transaction.toString()
    }
    const response: RequestResponseData = await this.callMethod(
      "avm.issueTx",
      params
    )
    return response.data.result.txID
  }

  /**
   * Calls the node's getAddressTxs method from the API and returns transactions corresponding to the provided address and assetID
   *
   * @param address The address for which we're fetching related transactions.
   * @param cursor Page number or offset.
   * @param pageSize  Number of items to return per page. Optional. Defaults to 1024. If [pageSize] == 0 or [pageSize] > [maxPageSize], then it fetches at max [maxPageSize] transactions
   * @param assetID Only return transactions that changed the balance of this asset. Must be an ID or an alias for an asset.
   *
   * @returns A promise object representing the array of transaction IDs and page offset
   */
  getAddressTxs = async (
    address: string,
    cursor: number,
    pageSize: number | undefined,
    assetID: string | Buffer
  ): Promise<GetAddressTxsResponse> => {
    let asset: string
    let pageSizeNum: number

    if (typeof assetID !== "string") {
      asset = bintools.cb58Encode(assetID)
    } else {
      asset = assetID
    }

    if (typeof pageSize !== "number") {
      pageSizeNum = 0
    } else {
      pageSizeNum = pageSize
    }

    const params: GetAddressTxsParams = {
      address,
      cursor,
      pageSize: pageSizeNum,
      assetID: asset
    }

    const response: RequestResponseData = await this.callMethod(
      "avm.getAddressTxs",
      params
    )
    return response.data.result
  }

  /**
   * Sends an amount of assetID to the specified address from a list of owned of addresses.
   *
   * @param username The user that owns the private keys associated with the `from` addresses
   * @param password The password unlocking the user
   * @param assetID The assetID of the asset to send
   * @param amount The amount of the asset to be sent
   * @param to The address of the recipient
   * @param from Optional. An array of addresses managed by the node's keystore for this blockchain which will fund this transaction
   * @param changeAddr Optional. An address to send the change
   * @param memo Optional. CB58 Buffer or String which contains arbitrary bytes, up to 256 bytes
   *
   * @returns Promise for the string representing the transaction's ID.
   */
  send = async (
    username: string,
    password: string,
    assetID: string | Buffer,
    amount: number | BN,
    to: string,
    from: string[] | Buffer[] = undefined,
    changeAddr: string = undefined,
    memo: string | Buffer = undefined
  ): Promise<SendResponse> => {
    let asset: string
    let amnt: BN

    if (typeof this.parseAddress(to) === "undefined") {
      /* istanbul ignore next */
      throw new AddressError("Error - AVMAPI.send: Invalid address format")
    }

    if (typeof assetID !== "string") {
      asset = bintools.cb58Encode(assetID)
    } else {
      asset = assetID
    }
    if (typeof amount === "number") {
      amnt = new BN(amount)
    } else {
      amnt = amount
    }

    const params: SendParams = {
      username: username,
      password: password,
      assetID: asset,
      amount: amnt.toString(10),
      to: to
    }

    const caller: string = "send"
    from = this._cleanAddressArray(from, caller)
    if (typeof from !== "undefined") {
      params["from"] = from
    }

    if (typeof changeAddr !== "undefined") {
      if (typeof this.parseAddress(changeAddr) === "undefined") {
        /* istanbul ignore next */
        throw new AddressError("Error - AVMAPI.send: Invalid address format")
      }
      params["changeAddr"] = changeAddr
    }

    if (typeof memo !== "undefined") {
      if (typeof memo !== "string") {
        params["memo"] = bintools.cb58Encode(memo)
      } else {
        params["memo"] = memo
      }
    }
    const response: RequestResponseData = await this.callMethod(
      "avm.send",
      params
    )
    return response.data.result
  }

  /**
   * Sends an amount of assetID to an array of specified addresses from a list of owned of addresses.
   *
   * @param username The user that owns the private keys associated with the `from` addresses
   * @param password The password unlocking the user
   * @param sendOutputs The array of SendOutputs. A SendOutput is an object literal which contains an assetID, amount, and to.
   * @param from Optional. An array of addresses managed by the node's keystore for this blockchain which will fund this transaction
   * @param changeAddr Optional. An address to send the change
   * @param memo Optional. CB58 Buffer or String which contains arbitrary bytes, up to 256 bytes
   *
   * @returns Promise for the string representing the transaction"s ID.
   */
  sendMultiple = async (
    username: string,
    password: string,
    sendOutputs: {
      assetID: string | Buffer
      amount: number | BN
      to: string
    }[],
    from: string[] | Buffer[] = undefined,
    changeAddr: string = undefined,
    memo: string | Buffer = undefined
  ): Promise<SendMultipleResponse> => {
    let asset: string
    let amnt: BN
    const sOutputs: SOutputsParams[] = []

    sendOutputs.forEach(
      (output: {
        assetID: string | Buffer
        amount: number | BN
        to: string
      }) => {
        if (typeof this.parseAddress(output.to) === "undefined") {
          /* istanbul ignore next */
          throw new AddressError(
            "Error - AVMAPI.sendMultiple: Invalid address format"
          )
        }
        if (typeof output.assetID !== "string") {
          asset = bintools.cb58Encode(output.assetID)
        } else {
          asset = output.assetID
        }
        if (typeof output.amount === "number") {
          amnt = new BN(output.amount)
        } else {
          amnt = output.amount
        }
        sOutputs.push({
          to: output.to,
          assetID: asset,
          amount: amnt.toString(10)
        })
      }
    )

    const params: SendMultipleParams = {
      username: username,
      password: password,
      outputs: sOutputs
    }

    const caller: string = "send"
    from = this._cleanAddressArray(from, caller)
    if (typeof from !== "undefined") {
      params.from = from
    }

    if (typeof changeAddr !== "undefined") {
      if (typeof this.parseAddress(changeAddr) === "undefined") {
        /* istanbul ignore next */
        throw new AddressError("Error - AVMAPI.send: Invalid address format")
      }
      params.changeAddr = changeAddr
    }

    if (typeof memo !== "undefined") {
      if (typeof memo !== "string") {
        params.memo = bintools.cb58Encode(memo)
      } else {
        params.memo = memo
      }
    }
    const response: RequestResponseData = await this.callMethod(
      "avm.sendMultiple",
      params
    )
    return response.data.result
  }

  /**
   * Given a JSON representation of this Virtual Machine’s genesis state, create the byte representation of that state.
   *
   * @param genesisData The blockchain's genesis data object
   *
   * @returns Promise of a string of bytes
   */
  buildGenesis = async (genesisData: object): Promise<string> => {
    const params: BuildGenesisParams = {
      genesisData
    }
    const response: RequestResponseData = await this.callMethod(
      "avm.buildGenesis",
      params
    )
    return response.data.result.bytes
  }

  /**
   * @ignore
   */
  protected _cleanAddressArray(
    addresses: string[] | Buffer[],
    caller: string
  ): string[] {
    const addrs: string[] = []
    const chainID: string = this.getBlockchainAlias()
      ? this.getBlockchainAlias()
      : this.getBlockchainID()
    if (addresses && addresses.length > 0) {
      for (let i: number = 0; i < addresses.length; i++) {
        if (typeof addresses[`${i}`] === "string") {
          if (
            typeof this.parseAddress(addresses[`${i}`] as string) ===
            "undefined"
          ) {
            /* istanbul ignore next */
            throw new AddressError(
              "Error - AVMAPI.${caller}: Invalid address format"
            )
          }
          addrs.push(addresses[`${i}`] as string)
        } else {
          const type: SerializedType = "bech32"
          addrs.push(
            serialization.bufferToType(
              addresses[`${i}`] as Buffer,
              type,
              this.core.getHRP(),
              chainID
            )
          )
        }
      }
    }
    return addrs
  }

  /**
   * This class should not be instantiated directly. Instead use the [[Avalanche.addAP`${I}`]] method.
   *
   * @param core A reference to the Avalanche class
   * @param baseURL Defaults to the string "/ext/bc/X" as the path to blockchain's baseURL
   * @param blockchainID The Blockchain"s ID. Defaults to an empty string: ""
   */
  constructor(
    core: AvalancheCore,
    baseURL: string = "/ext/bc/X",
    blockchainID: string = ""
  ) {
    super(core, baseURL)
    this.blockchainID = blockchainID
    const netID: number = core.getNetworkID()
    if (
      netID in Defaults.network &&
      blockchainID in Defaults.network[`${netID}`]
    ) {
      const alias: string =
        Defaults.network[`${netID}`][`${blockchainID}`]["alias"]
      this.keychain = new KeyChain(this.core.getHRP(), alias)
    } else {
      this.keychain = new KeyChain(this.core.getHRP(), blockchainID)
    }
  }
}
