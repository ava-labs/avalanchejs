import { testAddress1, testEthAddress1 } from '../fixtures/vms';
import { testContext } from '../fixtures/context';
import { newExportTxFromBaseFee, newImportTxFromBaseFee } from '../vms/evm';
import { Utxo } from '../serializable/avax/utxo';
import { utxoId } from '../fixtures/avax';
import { Address, Id } from '../serializable/fxs/common';
import { OutputOwners, TransferOutput } from '../serializable/fxs/secp256k1';
import { BigIntPr, Int } from '../serializable/primitives';
import { validateEvmBurnedAmount } from './validateEvmBurnedAmount';

const utxoMock = new Utxo(
  utxoId(),
  Id.fromString(testContext.avaxAssetID),
  new TransferOutput(
    new BigIntPr(1000000000000n),
    new OutputOwners(new BigIntPr(0n), new Int(1), [
      Address.fromBytes(testAddress1)[0],
    ]),
  ),
);

describe('validateEvmBurnedAmount', () => {
  describe('export from C', () => {
    const unsignedTx = newExportTxFromBaseFee(
      testContext,
      25n,
      1000000000n,
      'X',
      testEthAddress1,
      [testAddress1],
      1n,
    );
    it('throws if feeTolerance is incorrect', () => {
      expect(() =>
        validateEvmBurnedAmount({
          unsignedTx,
          burnedAmount: (280750n * 75n) / 100n, // 25% lower,
          baseFee: 25n,
          feeTolerance: 0.5,
        }),
      ).toThrowError('feeTolerance must be [1,100]');

      expect(() =>
        validateEvmBurnedAmount({
          unsignedTx,
          burnedAmount: (280750n * 75n) / 100n, // 25% lower,
          baseFee: 25n,
          feeTolerance: 101,
        }),
      ).toThrowError('feeTolerance must be [1,100]');
    });

    it('returns true if burned amount is in the tolerance range', () => {
      const resultLower = validateEvmBurnedAmount({
        unsignedTx,
        burnedAmount: (280750n * 75n) / 100n, // 25% lower
        baseFee: 25n,
        feeTolerance: 50.9,
      });

      const resultHigher = validateEvmBurnedAmount({
        unsignedTx,
        burnedAmount: (280750n * 125n) / 100n, // 25% higher
        baseFee: 25n,
        feeTolerance: 50.9,
      });

      expect(resultLower).toStrictEqual({
        isValid: true,
        txFee: (280750n * 75n) / 100n,
      });
      expect(resultHigher).toStrictEqual({
        isValid: true,
        txFee: (280750n * 125n) / 100n,
      });
    });

    it('returns false if burned amount is not in the tolerance range', () => {
      const resultLower = validateEvmBurnedAmount({
        unsignedTx,
        burnedAmount: (280750n * 49n) / 100n, // 51% lower
        baseFee: 25n,
        feeTolerance: 50.9,
      });

      const resultHigher = validateEvmBurnedAmount({
        unsignedTx,
        burnedAmount: (280750n * 151n) / 100n, // 51% higher
        baseFee: 25n,
        feeTolerance: 50.9,
      });

      expect(resultLower).toStrictEqual({
        isValid: false,
        txFee: (280750n * 49n) / 100n,
      });
      expect(resultHigher).toStrictEqual({
        isValid: false,
        txFee: (280750n * 151n) / 100n,
      });
    });
  });

  describe('import to C', () => {
    const unsignedTx = newImportTxFromBaseFee(
      testContext,
      testEthAddress1,
      [testAddress1],
      [utxoMock],
      'X',
      25n,
    );

    it('returns true if burned amount is in the tolerance range', () => {
      const resultLower = validateEvmBurnedAmount({
        unsignedTx,
        burnedAmount: (280750n * 75n) / 100n, // 25% lower
        baseFee: 25n,
        feeTolerance: 50.9,
      });

      const resultHigher = validateEvmBurnedAmount({
        unsignedTx,
        burnedAmount: (280750n * 125n) / 100n, // 25% higher
        baseFee: 25n,
        feeTolerance: 50.9,
      });

      expect(resultLower).toStrictEqual({
        isValid: true,
        txFee: (280750n * 75n) / 100n,
      });
      expect(resultHigher).toStrictEqual({
        isValid: true,
        txFee: (280750n * 125n) / 100n,
      });
    });

    it('returns false if burned amount is not in the tolerance range', () => {
      const resultLower = validateEvmBurnedAmount({
        unsignedTx,
        burnedAmount: (280750n * 49n) / 100n, // 51% lower
        baseFee: 25n,
        feeTolerance: 50.9,
      });

      const resultHigher = validateEvmBurnedAmount({
        unsignedTx,
        burnedAmount: (280750n * 151n) / 100n, // 51% higher
        baseFee: 25n,
        feeTolerance: 50.9,
      });

      expect(resultLower).toStrictEqual({
        isValid: false,
        txFee: (280750n * 49n) / 100n,
      });
      expect(resultHigher).toStrictEqual({
        isValid: false,
        txFee: (280750n * 151n) / 100n,
      });
    });
  });
});
