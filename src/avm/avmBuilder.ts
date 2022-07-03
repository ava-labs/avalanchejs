import {
  BaseTx,
  TransferableInput,
  TransferableOutput,
} from '../components/avax';
import type { Utxo } from '../components/avax/utxo';
import { Address, Id } from '../fxs/common';
import {
  Input,
  OutputOwners,
  TransferInput,
  TransferOutput,
} from '../fxs/secp256k1';
import { BigIntPr, Bytes, Int } from '../primitives';
import { bigIntMin } from '../utils/bigintMath';
import { matchOwners } from '../utils/matchOwners';
import {
  compareTransferableInputs,
  compareTransferableOutputs,
} from '../utils/sort';
import { ExportTx } from '../vms/avm';
import { getAVMContextFromURI } from './context';
import type { AVMContext } from './models';

type SpendOptions = {
  minIssuanceTime?: bigint;
  changeAddresses?: string[];
  threashold: number;
  memo?: Uint8Array;
  locktime?: bigint;
};

type SpendOptionsRequired = Required<SpendOptions>;

export class XBuilder {
  constructor(private readonly context: AVMContext) {}
  static async fromURI(baseURL?: string): Promise<XBuilder> {
    return new XBuilder(await getAVMContextFromURI('AVAX', baseURL));
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
      utxoSet,
      fromAddresses,
      defaultedOptions,
    );

    outputs.sort(compareTransferableOutputs);
    return new ExportTx(
      new BaseTx(
        new Int(this.context.networkID),
        new Id(this.context.blockchainID),
        changeOutputs,
        inputs,
        new Bytes(defaultedOptions.memo),
      ),
      new Id(chainId),
      outputs,
    );
  }

  spend(
    amountsToBurn: Map<string, bigint>,
    utxos: Utxo[],
    fromAddresses: string[],
    options: SpendOptionsRequired,
  ) {
    const inputs: TransferableInput[] = [];
    const changeOutputs: TransferableOutput[] = [];
    const changeOwner = new OutputOwners(
      new BigIntPr(0n),
      new Int(1),
      options.changeAddresses.map((addr) => new Address(addr)),
    );

    utxos.forEach((utxo) => {
      const remainingAmountToBurn = amountsToBurn.get(utxo.assetId.value());
      if (!remainingAmountToBurn) {
        return;
      }
      if (!(utxo.output instanceof TransferOutput)) {
        // We only support burning [secp256k1fx.TransferOutput]s.
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

      amountsToBurn[utxo.assetId.value()] -= amountToBurn;
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

    inputs.sort(compareTransferableInputs);
    changeOutputs.sort(compareTransferableOutputs);

    return { inputs, changeOutputs };
  }
}
