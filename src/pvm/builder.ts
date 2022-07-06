import {
  BaseTx,
  TransferableInput,
  TransferableOutput,
} from '../components/avax';
import type { Utxo } from '../components/avax/utxo';
import { PlatformChainID } from '../constants/networkIDs';
import { Address, Id } from '../fxs/common';
import {
  Input,
  OutputOwners,
  TransferInput,
  TransferOutput,
} from '../fxs/secp256k1';
import { BigIntPr, Bytes, Int } from '../primitives';
import { bigIntMin } from '../utils/bigintMath';
import { bufferToHex } from '../utils/buffer';
import { matchOwners } from '../utils/matchOwners';
import {
  compareTransferableInputs,
  compareTransferableOutputs,
} from '../utils/sort';
import { ExportTx, StakableLockIn, StakableLockOut } from '../vms/pvm';
import { getPVMContextFromURI } from './context';
import type { PVMContext } from './models';

/* 
  Builder is useful for building transactions that are specific to a chain. 
 */

type SpendOptions = {
  minIssuanceTime?: bigint;
  changeAddresses?: string[];
  threashold: number;
  memo?: Uint8Array;
  locktime?: bigint;
};

type SpendOptionsRequired = Required<SpendOptions>;

export class PVMBuilder {
  constructor(private context: PVMContext) {}
  static async fromURI(baseURL?: string): Promise<PVMBuilder> {
    return new PVMBuilder(await getPVMContextFromURI('AVAX', baseURL));
  }

  defaultSpendOptions(
    fromAddress: string[],
    options?: SpendOptions,
  ): SpendOptionsRequired {
    return {
      minIssuanceTime: BigInt(Math.floor(new Date().getTime() / 100)),
      changeAddresses: fromAddress,
      threashold: 1,
      memo: new Uint8Array(),
      locktime: 0n,
      ...options,
    };
  }

  newExportTx(
    chainId: string,
    fromAddresses: string[],
    utxoSet: Utxo[],
    outputs: TransferableOutput[],
    options: SpendOptions,
  ) {
    const defaultedOptions = this.defaultSpendOptions(fromAddresses, options);
    const toBurn = new Map<string, bigint>([
      [this.context.avaxAssetID, this.context.baseTxFee],
    ]);

    outputs.forEach((out) => {
      const assetId = out.assetId.value();
      toBurn.set(assetId, (toBurn.get(assetId) || 0n) + out.output.amount());
    });

    const { inputs, changeOutputs } = this.spend(
      toBurn,
      new Map(),
      utxoSet,
      fromAddresses,
      defaultedOptions,
    );

    outputs.sort(compareTransferableOutputs);
    return new ExportTx(
      new BaseTx(
        new Int(this.context.networkID),
        new Id(bufferToHex(PlatformChainID)),
        changeOutputs,
        inputs,
        new Bytes(defaultedOptions.memo),
      ),
      new Id(chainId),
      outputs,
    );
  }

  // TODO: this function is really big refactor this
  spend(
    amountsToBurn: Map<string, bigint>,
    amountsToStake: Map<string, bigint>,
    utxos: Utxo[],
    fromAddresses: string[],
    options: SpendOptionsRequired,
  ): {
    stakeOutputs: TransferableOutput[];
    changeOutputs: TransferableOutput[];
    inputs: TransferableInput[];
  } {
    const inputs: TransferableInput[] = [];
    const changeOutputs: TransferableOutput[] = [];
    const stakeOutputs: TransferableOutput[] = [];
    const changeOwner = new OutputOwners(
      new BigIntPr(0n),
      new Int(1),
      options.changeAddresses.map((addr) => new Address(addr)),
    );

    const unlockedUTXOs = utxos.filter(
      (utxo) => utxo.output instanceof TransferOutput,
    );
    const lockedUTXOs = utxos.filter(
      (utxo) => utxo.output instanceof StakableLockOut,
    );

    lockedUTXOs.forEach((utxo) => {
      const assetId = utxo.assetId.value();
      const remainingAmountToStake = amountsToStake.get(assetId) ?? 0n;

      if (!remainingAmountToStake) {
        return;
      }

      const lockedOutput = utxo.output as StakableLockOut;
      if (options.minIssuanceTime >= lockedOutput.lockTime.value()) {
        return;
      }

      if (!(lockedOutput.transferOut instanceof TransferOutput)) {
        throw new Error('unknown output type');
      }

      const out = lockedOutput.transferOut as TransferOutput;

      const inputSigIndicies = matchOwners(
        out.outputOwners,
        new Set(fromAddresses),
        options.minIssuanceTime,
      );

      if (!inputSigIndicies) {
        return;
      }

      inputs.push(
        new TransferableInput(
          utxo.utxoId,
          utxo.assetId,
          new StakableLockIn(
            lockedOutput.lockTime,
            new TransferInput(
              out.amt,
              new Input(inputSigIndicies.map((i) => new Int(i))),
            ),
          ),
        ),
      );

      const amountToStake = bigIntMin(remainingAmountToStake, out.amt.value());
      stakeOutputs.push(
        new TransferableOutput(
          utxo.assetId,
          new StakableLockOut(
            lockedOutput.lockTime,
            new TransferOutput(amountToStake, out.outputOwners),
          ),
        ),
      );
      amountsToStake.set(assetId, remainingAmountToStake - amountToStake);
      const remainingAmount = out.amount() - amountToStake;
      if (remainingAmount > 0n) {
        changeOutputs.push(
          new TransferableOutput(
            utxo.assetId,
            new StakableLockOut(
              lockedOutput.lockTime,
              new TransferOutput(
                new BigIntPr(remainingAmount),
                out.outputOwners,
              ),
            ),
          ),
        );
      }
    });

    unlockedUTXOs.forEach((utxo) => {
      const remainingAmountToBurn =
        amountsToBurn.get(utxo.assetId.value()) ?? 0n;
      const remainingAmountToStake =
        amountsToStake.get(utxo.assetId.value()) ?? 0n;
      if (!remainingAmountToBurn && !remainingAmountToStake) {
        return;
      }

      const utxoTransferout = utxo.output as TransferOutput;

      const inputSigIndicies = matchOwners(
        utxoTransferout.outputOwners,
        new Set(fromAddresses),
        options.minIssuanceTime,
      );

      if (!inputSigIndicies) {
        return;
      }

      inputs.push(
        new TransferableInput(
          utxo.utxoId,
          utxo.assetId,
          new TransferInput(
            utxoTransferout.amt,
            new Input(inputSigIndicies.map((i) => new Int(i))),
          ),
        ),
      );

      const amountToBurn = bigIntMin(
        remainingAmountToBurn,
        utxoTransferout.amt.value(),
      );

      amountsToBurn.set(
        utxo.assetId.value(),
        remainingAmountToBurn - amountToBurn,
      );

      const amountAvailableToStake = utxoTransferout.amount() - amountToBurn;
      const amountToStake = bigIntMin(
        remainingAmountToStake,
        amountAvailableToStake,
      );

      amountsToStake.set(
        utxo.assetId.value(),
        amountsToStake.get(utxo.assetId.value()) ?? 0n - amountToStake,
      );

      if (amountToStake > 0n) {
        stakeOutputs.push(
          new TransferableOutput(
            utxo.assetId,
            new TransferOutput(amountToStake, changeOwner),
          ),
        );
      }

      const remainingAmount = utxoTransferout.amt.value() - amountToBurn;
      if (remainingAmount > 0) {
        changeOutputs.push(
          new TransferableOutput(
            utxo.assetId,
            new TransferOutput(new BigIntPr(remainingAmount), changeOwner),
          ),
        );
      }
    });

    amountsToBurn.forEach((amount, assetId) => {
      if (amount !== 0n) {
        throw new Error(
          `insufficient funds: need ${amount} more units of ${assetId}`,
        );
      }
    });

    amountsToStake.forEach((amount, assetId) => {
      if (amount !== 0n) {
        throw new Error(
          `insufficient funds: need ${amount} more units of ${assetId} to stake`,
        );
      }
    });

    inputs.sort(compareTransferableInputs);
    changeOutputs.sort(compareTransferableOutputs);
    stakeOutputs.sort(compareTransferableOutputs);

    return { inputs, changeOutputs, stakeOutputs };
  }
}
