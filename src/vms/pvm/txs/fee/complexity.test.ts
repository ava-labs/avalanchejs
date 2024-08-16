import { utxoId } from '../../../../fixtures/avax';
import { address, id } from '../../../../fixtures/common';
import { bigIntPr, int, ints } from '../../../../fixtures/primitives';
import { signer } from '../../../../fixtures/pvm';
import {
  Input,
  OutputOwners,
  TransferInput,
  TransferOutput,
  TransferableInput,
  TransferableOutput,
} from '../../../../serializable';
import {
  SignerEmpty,
  StakeableLockIn,
  StakeableLockOut,
} from '../../../../serializable/pvm';
import { hexToBuffer, unpackWithManager } from '../../../../utils';
import { FeeDimensions, makeDimensions } from '../../../common/fees/dimensions';
import {
  authComplexity,
  inputComplexity,
  outputComplexity,
  ownerComplexity,
  signerComplexity,
  txComplexity,
} from './complexity';
import {
  INTRINSIC_ADD_PERMISSIONLESS_DELEGATOR_TX_COMPLEXITIES,
  INTRINSIC_ADD_PERMISSIONLESS_VALIDATOR_TX_COMPLEXITIES,
  INTRINSIC_ADD_SUBNET_VALIDATOR_TX_COMPLEXITIES,
  INTRINSIC_BASE_TX_COMPLEXITIES,
  INTRINSIC_CREATE_CHAIN_TX_COMPLEXITIES,
  INTRINSIC_CREATE_SUBNET_TX_COMPLEXITIES,
  INTRINSIC_EXPORT_TX_COMPLEXITIES,
  INTRINSIC_IMPORT_TX_COMPLEXITIES,
  INTRINSIC_INPUT_DB_READ,
  INTRINSIC_INPUT_DB_WRITE,
  INTRINSIC_OUTPUT_DB_WRITE,
  INTRINSIC_TRANSFER_SUBNET_OWNERSHIP_TX_COMPLEXITIES,
} from './constants';

const makeOutputOwners = (numOfAddresses = 0) =>
  new OutputOwners(
    bigIntPr(),
    int(),
    new Array(numOfAddresses).fill(address()),
  );

const makeTransferableOutput = (numOfAddresses = 0) =>
  new TransferableOutput(
    id(),
    new TransferOutput(bigIntPr(), makeOutputOwners(numOfAddresses)),
  );

const makeTransferableInput = (numOfSigInts = 0) =>
  new TransferableInput(
    utxoId(),
    id(),
    new TransferInput(
      bigIntPr(),
      new Input(new Array(numOfSigInts).fill(int())),
    ),
  );

describe('Complexity', () => {
  describe('outputComplexity', () => {
    test('empty transferable output', () => {
      const result = outputComplexity([]);

      expect(result).toEqual(makeDimensions(0, 0, 0, 0));
    });

    test('any can spend', () => {
      const result = outputComplexity([makeTransferableOutput()]);

      expect(result).toEqual(makeDimensions(60, 0, 1, 0));
    });

    test('one owner', () => {
      const result = outputComplexity([makeTransferableOutput(1)]);

      expect(result).toEqual(makeDimensions(80, 0, 1, 0));
    });

    test('three owners', () => {
      const result = outputComplexity([makeTransferableOutput(3)]);

      expect(result).toEqual(makeDimensions(120, 0, 1, 0));
    });

    test('locked stakeable', () => {
      const result = outputComplexity([
        new TransferableOutput(
          id(),
          new StakeableLockOut(
            bigIntPr(),
            new TransferOutput(bigIntPr(), makeOutputOwners(3)),
          ),
        ),
      ]);

      expect(result).toEqual(makeDimensions(132, 0, 1, 0));
    });
  });

  describe('inputComplexity', () => {
    test('any can spend', () => {
      const result = inputComplexity([makeTransferableInput()]);

      expect(result).toEqual(
        makeDimensions(
          92,
          1,
          1,
          0, // TODO: Implement
        ),
      );
    });

    test('one owner', () => {
      const result = inputComplexity([makeTransferableInput(1)]);

      expect(result).toEqual(
        makeDimensions(
          161,
          1,
          1,
          0, // TODO: Implement
        ),
      );
    });

    test('three owners', () => {
      const result = inputComplexity([makeTransferableInput(3)]);

      expect(result).toEqual(
        makeDimensions(
          299,
          1,
          1,
          0, // TODO: Implement
        ),
      );
    });

    test('locked stakeable', () => {
      const result = inputComplexity([
        new TransferableInput(
          utxoId(),
          id(),
          new StakeableLockIn(
            bigIntPr(),
            new TransferInput(bigIntPr(), new Input(new Array(3).fill(int()))),
          ),
        ),
      ]);

      expect(result).toEqual(
        makeDimensions(
          311,
          1,
          1,
          0, // TODO: Implement
        ),
      );
    });
  });

  describe('ownerComplexity', () => {
    test('any can spend', () => {
      const result = ownerComplexity(makeOutputOwners());

      expect(result).toEqual(makeDimensions(16, 0, 0, 0));
    });

    test('one owner', () => {
      const result = ownerComplexity(makeOutputOwners(1));

      expect(result).toEqual(makeDimensions(36, 0, 0, 0));
    });

    test('three owners', () => {
      const result = ownerComplexity(makeOutputOwners(3));

      expect(result).toEqual(makeDimensions(76, 0, 0, 0));
    });
  });

  describe('signerComplexity', () => {
    test('empty signer', () => {
      const result = signerComplexity(new SignerEmpty());

      expect(result).toEqual(makeDimensions(0, 0, 0, 0));
    });

    test('bls pop', () => {
      const result = signerComplexity(signer());

      expect(result).toEqual(
        makeDimensions(
          144,
          0,
          0,
          // TODO: Implement compute
          0,
        ),
      );
    });
  });

  describe('authComplexity', () => {
    test('any can spend', () => {
      const result = authComplexity(new Input([]));

      expect(result).toEqual(
        makeDimensions(
          8,
          0,
          0,
          0, // TODO: Implement
        ),
      );
    });

    test('one owner', () => {
      const result = authComplexity(new Input([int()]));

      expect(result).toEqual(
        makeDimensions(
          77,
          0,
          0,
          0, // TODO: Implement
        ),
      );
    });

    test('three owners', () => {
      const result = authComplexity(new Input(ints()));

      expect(result).toEqual(
        makeDimensions(
          215,
          0,
          0,
          0, // TODO: Implement
        ),
      );
    });

    test('invalid auth type', () => {
      expect(() => {
        authComplexity(int());
      }).toThrow(
        'Unable to calculate auth complexity of transaction. Expected Input as subnet auth.',
      );
    });
  });

  describe('txComplexity', () => {
    const vm = 'PVM';

    test.each([
      {
        name: 'BaseTx',
        txHex:
          '00000000002200003039000000000000000000000000000000000000000000000000000000000000000000000002dbcf890f77f49b96857648b72b77f9f82937f28a68704af05da0dc12ba53f2db00000007000000003b9aca00000000000000000100000002000000024a177205df5c29929d06db9d941f83d5ea985de3e902a9a86640bfdb1cd0e36c0cc982b83e5765fadbcf890f77f49b96857648b72b77f9f82937f28a68704af05da0dc12ba53f2db000000070023834ed587af80000000000000000000000001000000013cb7d3842e8cee6a0ebd09f1fe884f6861e1b29c00000001fa4ff39749d44f29563ed9da03193d4a19ef419da4ce326594817ca266fda5ed00000000dbcf890f77f49b96857648b72b77f9f82937f28a68704af05da0dc12ba53f2db000000050023834f1131bbc00000000100000000000000000000000100000009000000014a7b54c63dd25a532b5fe5045b6d0e1db876e067422f12c9c327333c2c792d9273405ac8bbbc2cce549bbd3d0f9274242085ee257adfdb859b0f8d55bdd16fb000',
        expectedComplexity: makeDimensions(
          399,
          INTRINSIC_BASE_TX_COMPLEXITIES[FeeDimensions.DBRead] +
            INTRINSIC_INPUT_DB_READ,
          INTRINSIC_BASE_TX_COMPLEXITIES[FeeDimensions.DBWrite] +
            INTRINSIC_INPUT_DB_WRITE +
            2 * INTRINSIC_OUTPUT_DB_WRITE,
          0, // TODO: Implement
        ),
      },

      {
        name: 'AddPermissionlessValidatorTx for primary network',
        txHex:
          '00000000001900003039000000000000000000000000000000000000000000000000000000000000000000000001dbcf890f77f49b96857648b72b77f9f82937f28a68704af05da0dc12ba53f2db0000000700238520ba8b1e00000000000000000000000001000000013cb7d3842e8cee6a0ebd09f1fe884f6861e1b29c00000001043c91e9d508169329034e2a68110427a311f945efc53ed3f3493d335b393fd100000000dbcf890f77f49b96857648b72b77f9f82937f28a68704af05da0dc12ba53f2db00000005002386f263d53e00000000010000000000000000c582872c37c81efa2c94ea347af49cdc23a830aa00000000669ae35f0000000066b692df000001d1a94a200000000000000000000000000000000000000000000000000000000000000000000000001ca3783a891cb41cadbfcf456da149f30e7af972677a162b984bef0779f254baac51ec042df1781d1295df80fb41c801269731fc6c25e1e5940dc3cb8509e30348fa712742cfdc83678acc9f95908eb98b89b28802fb559b4a2a6ff3216707c07f0ceb0b45a95f4f9a9540bbd3331d8ab4f233bffa4abb97fad9d59a1695f31b92a2b89e365facf7ab8c30de7c4a496d1e00000001dbcf890f77f49b96857648b72b77f9f82937f28a68704af05da0dc12ba53f2db00000007000001d1a94a2000000000000000000000000001000000013cb7d3842e8cee6a0ebd09f1fe884f6861e1b29c0000000b000000000000000000000001000000013cb7d3842e8cee6a0ebd09f1fe884f6861e1b29c0000000b000000000000000000000001000000013cb7d3842e8cee6a0ebd09f1fe884f6861e1b29c0007a12000000001000000090000000135f122f90bcece0d6c43e07fed1829578a23bc1734f8a4b46203f9f192ea1aec7526f3dca8fddec7418988615e6543012452bae1544275aae435313ec006ec9000',
        expectedComplexity: makeDimensions(
          691,
          INTRINSIC_ADD_PERMISSIONLESS_VALIDATOR_TX_COMPLEXITIES[
            FeeDimensions.DBRead
          ] + INTRINSIC_INPUT_DB_READ,
          INTRINSIC_ADD_PERMISSIONLESS_VALIDATOR_TX_COMPLEXITIES[
            FeeDimensions.DBWrite
          ] +
            INTRINSIC_INPUT_DB_WRITE +
            2 * INTRINSIC_OUTPUT_DB_WRITE,
          0, // TODO: Implement
        ),
      },

      {
        name: 'AddPermissionlessValidatorTx for subnet',
        txHex:
          '000000000019000030390000000000000000000000000000000000000000000000000000000000000000000000022f6399f3e626fe1e75f9daa5e726cb64b7bfec0b6e6d8930eaa9dfa336edca7a000000070000000000006091000000000000000000000001000000013cb7d3842e8cee6a0ebd09f1fe884f6861e1b29cdbcf890f77f49b96857648b72b77f9f82937f28a68704af05da0dc12ba53f2db0000000700238520ba6c9980000000000000000000000001000000013cb7d3842e8cee6a0ebd09f1fe884f6861e1b29c00000002038b42b73d3dc695c76ca12f966e97fe0681b1200f9a5e28d088720a18ea23c9000000002f6399f3e626fe1e75f9daa5e726cb64b7bfec0b6e6d8930eaa9dfa336edca7a00000005000000000000609b0000000100000000a378b74b3293a9d885bd9961f2cc2e1b3364d393c9be875964f2bd614214572c00000000dbcf890f77f49b96857648b72b77f9f82937f28a68704af05da0dc12ba53f2db0000000500238520ba7bdbc0000000010000000000000000c582872c37c81efa2c94ea347af49cdc23a830aa0000000066a57a160000000066b7ef16000000000000000a97ea88082100491617204ed70c19fc1a2fce4474bee962904359d0b59e84c1240000001b000000012f6399f3e626fe1e75f9daa5e726cb64b7bfec0b6e6d8930eaa9dfa336edca7a00000007000000000000000a000000000000000000000001000000013cb7d3842e8cee6a0ebd09f1fe884f6861e1b29c0000000b000000000000000000000000000000000000000b00000000000000000000000000000000000f4240000000020000000900000001593fc20f88a8ce0b3470b0bb103e5f7e09f65023b6515d36660da53f9a15dedc1037ee27a8c4a27c24e20ad3b0ab4bd1ff3a02a6fcc2cbe04282bfe9902c9ae6000000000900000001593fc20f88a8ce0b3470b0bb103e5f7e09f65023b6515d36660da53f9a15dedc1037ee27a8c4a27c24e20ad3b0ab4bd1ff3a02a6fcc2cbe04282bfe9902c9ae600',
        expectedComplexity: makeDimensions(
          748,
          INTRINSIC_ADD_PERMISSIONLESS_VALIDATOR_TX_COMPLEXITIES[
            FeeDimensions.DBRead
          ] +
            2 * INTRINSIC_INPUT_DB_READ,
          INTRINSIC_ADD_PERMISSIONLESS_VALIDATOR_TX_COMPLEXITIES[
            FeeDimensions.DBWrite
          ] +
            2 * INTRINSIC_INPUT_DB_WRITE +
            3 * INTRINSIC_OUTPUT_DB_WRITE,
          0, // TODO: Implement
        ),
      },

      {
        name: 'AddPermissionlessDelegatorTx for primary network',
        txHex:
          '00000000001a00003039000000000000000000000000000000000000000000000000000000000000000000000001dbcf890f77f49b96857648b72b77f9f82937f28a68704af05da0dc12ba53f2db000000070023834f1140fe00000000000000000000000001000000013cb7d3842e8cee6a0ebd09f1fe884f6861e1b29c000000017d199179744b3b82d0071c83c2fb7dd6b95a2cdbe9dde295e0ae4f8c2287370300000000dbcf890f77f49b96857648b72b77f9f82937f28a68704af05da0dc12ba53f2db0000000500238520ba8b1e00000000010000000000000000c582872c37c81efa2c94ea347af49cdc23a830aa00000000669ae6080000000066ad5b08000001d1a94a2000000000000000000000000000000000000000000000000000000000000000000000000001dbcf890f77f49b96857648b72b77f9f82937f28a68704af05da0dc12ba53f2db00000007000001d1a94a2000000000000000000000000001000000013cb7d3842e8cee6a0ebd09f1fe884f6861e1b29c0000000b000000000000000000000001000000013cb7d3842e8cee6a0ebd09f1fe884f6861e1b29c0000000100000009000000012261556f74a29f02ffc2725a567db2c81f75d0892525dbebaa1cf8650534cc70061123533a9553184cb02d899943ff0bf0b39c77b173c133854bc7c8bc7ab9a400',
        expectedComplexity: makeDimensions(
          499,
          INTRINSIC_ADD_PERMISSIONLESS_DELEGATOR_TX_COMPLEXITIES[
            FeeDimensions.DBRead
          ] +
            1 * INTRINSIC_INPUT_DB_READ,
          INTRINSIC_ADD_PERMISSIONLESS_DELEGATOR_TX_COMPLEXITIES[
            FeeDimensions.DBWrite
          ] +
            1 * INTRINSIC_INPUT_DB_WRITE +
            2 * INTRINSIC_OUTPUT_DB_WRITE,
          0, // TODO: Implement
        ),
      },

      {
        name: 'AddPermissionlessDelegatorTx for subnet',
        txHex:
          '00000000001a000030390000000000000000000000000000000000000000000000000000000000000000000000022f6399f3e626fe1e75f9daa5e726cb64b7bfec0b6e6d8930eaa9dfa336edca7a000000070000000000006087000000000000000000000001000000013cb7d3842e8cee6a0ebd09f1fe884f6861e1b29cdbcf890f77f49b96857648b72b77f9f82937f28a68704af05da0dc12ba53f2db0000000700470c1336195b80000000000000000000000001000000013cb7d3842e8cee6a0ebd09f1fe884f6861e1b29c000000029494c80361884942e4292c3531e8e790fcf7561e74404ded27eab8634e3fb30f000000002f6399f3e626fe1e75f9daa5e726cb64b7bfec0b6e6d8930eaa9dfa336edca7a00000005000000000000609100000001000000009494c80361884942e4292c3531e8e790fcf7561e74404ded27eab8634e3fb30f00000001dbcf890f77f49b96857648b72b77f9f82937f28a68704af05da0dc12ba53f2db0000000500470c1336289dc0000000010000000000000000c582872c37c81efa2c94ea347af49cdc23a830aa0000000066a57c1d0000000066b7f11d000000000000000a97ea88082100491617204ed70c19fc1a2fce4474bee962904359d0b59e84c124000000012f6399f3e626fe1e75f9daa5e726cb64b7bfec0b6e6d8930eaa9dfa336edca7a00000007000000000000000a000000000000000000000001000000013cb7d3842e8cee6a0ebd09f1fe884f6861e1b29c0000000b00000000000000000000000000000000000000020000000900000001764190e2405fef72fce0d355e3dcc58a9f5621e583ae718cb2c23b55957995d1206d0b5efcc3cef99815e17a4b2cccd700147a759b7279a131745b237659666a000000000900000001764190e2405fef72fce0d355e3dcc58a9f5621e583ae718cb2c23b55957995d1206d0b5efcc3cef99815e17a4b2cccd700147a759b7279a131745b237659666a00',
        expectedComplexity: makeDimensions(
          720,
          INTRINSIC_ADD_PERMISSIONLESS_DELEGATOR_TX_COMPLEXITIES[
            FeeDimensions.DBRead
          ] +
            2 * INTRINSIC_INPUT_DB_READ,
          INTRINSIC_ADD_PERMISSIONLESS_DELEGATOR_TX_COMPLEXITIES[
            FeeDimensions.DBWrite
          ] +
            2 * INTRINSIC_INPUT_DB_WRITE +
            3 * INTRINSIC_OUTPUT_DB_WRITE,
          0, // TODO: Implement
        ),
      },

      {
        name: 'AddSubnetValidatorTx',
        txHex:
          '00000000000d00003039000000000000000000000000000000000000000000000000000000000000000000000001dbcf890f77f49b96857648b72b77f9f82937f28a68704af05da0dc12ba53f2db000000070023834f1131bbc0000000000000000000000001000000013cb7d3842e8cee6a0ebd09f1fe884f6861e1b29c0000000138f94d1a0514eaabdaf4c52cad8d62b26cee61eaa951f5b75a5e57c2ee3793c800000000dbcf890f77f49b96857648b72b77f9f82937f28a68704af05da0dc12ba53f2db000000050023834f1140fe00000000010000000000000000c582872c37c81efa2c94ea347af49cdc23a830aa00000000669ae7c90000000066ad5cc9000000000000c13797ea88082100491617204ed70c19fc1a2fce4474bee962904359d0b59e84c1240000000a00000001000000000000000200000009000000012127130d37877fb1ec4b2374ef72571d49cd7b0319a3769e5da19041a138166c10b1a5c07cf5ccf0419066cbe3bab9827cf29f9fa6213ebdadf19d4849501eb60000000009000000012127130d37877fb1ec4b2374ef72571d49cd7b0319a3769e5da19041a138166c10b1a5c07cf5ccf0419066cbe3bab9827cf29f9fa6213ebdadf19d4849501eb600',
        expectedComplexity: makeDimensions(
          460,
          INTRINSIC_ADD_SUBNET_VALIDATOR_TX_COMPLEXITIES[FeeDimensions.DBRead] +
            INTRINSIC_INPUT_DB_READ,
          INTRINSIC_ADD_SUBNET_VALIDATOR_TX_COMPLEXITIES[
            FeeDimensions.DBWrite
          ] +
            INTRINSIC_INPUT_DB_WRITE +
            INTRINSIC_OUTPUT_DB_WRITE,
          0, // TODO: Implement
        ),
      },

      {
        name: 'CreateChainTx',
        txHex:
          '00000000000f00003039000000000000000000000000000000000000000000000000000000000000000000000001dbcf890f77f49b96857648b72b77f9f82937f28a68704af05da0dc12ba53f2db00000007002386f263d53e00000000000000000000000001000000013cb7d3842e8cee6a0ebd09f1fe884f6861e1b29c0000000197ea88082100491617204ed70c19fc1a2fce4474bee962904359d0b59e84c12400000000dbcf890f77f49b96857648b72b77f9f82937f28a68704af05da0dc12ba53f2db00000005002386f269cb1f0000000001000000000000000097ea88082100491617204ed70c19fc1a2fce4474bee962904359d0b59e84c12400096c65742074686572657873766d00000000000000000000000000000000000000000000000000000000000000000000002a000000000000669ae21e000000013cb7d3842e8cee6a0ebd09f1fe884f6861e1b29cffffffffffffffff0000000a0000000100000000000000020000000900000001cf8104877b1a59b472f4f34d360c0e4f38e92c5fa334215430d0b99cf78eae8f621b6daf0b0f5c3a58a9497601f978698a1e5545d1873db8f2f38ecb7496c2f8010000000900000001cf8104877b1a59b472f4f34d360c0e4f38e92c5fa334215430d0b99cf78eae8f621b6daf0b0f5c3a58a9497601f978698a1e5545d1873db8f2f38ecb7496c2f801',
        expectedComplexity: makeDimensions(
          509,
          INTRINSIC_CREATE_CHAIN_TX_COMPLEXITIES[FeeDimensions.DBRead] +
            INTRINSIC_INPUT_DB_READ,
          INTRINSIC_CREATE_CHAIN_TX_COMPLEXITIES[FeeDimensions.DBWrite] +
            INTRINSIC_INPUT_DB_WRITE +
            INTRINSIC_OUTPUT_DB_WRITE,
          0, // TODO: Implement
        ),
      },

      {
        name: 'CreateSubnetTx',
        txHex:
          '00000000001000003039000000000000000000000000000000000000000000000000000000000000000000000001dbcf890f77f49b96857648b72b77f9f82937f28a68704af05da0dc12ba53f2db00000007002386f269cb1f00000000000000000000000001000000013cb7d3842e8cee6a0ebd09f1fe884f6861e1b29c00000001000000000000000000000000000000000000000000000000000000000000000000000001dbcf890f77f49b96857648b72b77f9f82937f28a68704af05da0dc12ba53f2db00000005002386f26fc100000000000100000000000000000000000b000000000000000000000001000000013cb7d3842e8cee6a0ebd09f1fe884f6861e1b29c000000010000000900000001b3c905e7227e619bd6b98c164a8b2b4a8ce89ac5142bbb1c42b139df2d17fd777c4c76eae66cef3de90800e567407945f58d918978f734f8ca4eda6923c78eb201',
        expectedComplexity: makeDimensions(
          339,
          INTRINSIC_CREATE_SUBNET_TX_COMPLEXITIES[FeeDimensions.DBRead] +
            INTRINSIC_INPUT_DB_READ,
          INTRINSIC_CREATE_SUBNET_TX_COMPLEXITIES[FeeDimensions.DBWrite] +
            INTRINSIC_INPUT_DB_WRITE +
            INTRINSIC_OUTPUT_DB_WRITE,
          0, // TODO: Implement
        ),
      },

      {
        name: 'ExportTx',
        txHex:
          '00000000001200003039000000000000000000000000000000000000000000000000000000000000000000000001dbcf890f77f49b96857648b72b77f9f82937f28a68704af05da0dc12ba53f2db000000070023834e99dda340000000000000000000000001000000013cb7d3842e8cee6a0ebd09f1fe884f6861e1b29c00000001f62c03574790b6a31a988f90c3e91c50fdd6f5d93baf200057463021ff23ec5c00000001dbcf890f77f49b96857648b72b77f9f82937f28a68704af05da0dc12ba53f2db000000050023834ed587af800000000100000000000000009d0775f450604bd2fbc49ce0c5c1c6dfeb2dc2acb8c92c26eeae6e6df4502b1900000001dbcf890f77f49b96857648b72b77f9f82937f28a68704af05da0dc12ba53f2db00000007000000003b9aca00000000000000000100000002000000024a177205df5c29929d06db9d941f83d5ea985de3e902a9a86640bfdb1cd0e36c0cc982b83e5765fa000000010000000900000001129a07c92045e0b9d0a203fcb5b53db7890fabce1397ff6a2ad16c98ef0151891ae72949d240122abf37b1206b95e05ff171df164a98e6bdf2384432eac2c30200',
        expectedComplexity: makeDimensions(
          435,
          INTRINSIC_EXPORT_TX_COMPLEXITIES[FeeDimensions.DBRead] +
            INTRINSIC_INPUT_DB_READ,
          INTRINSIC_EXPORT_TX_COMPLEXITIES[FeeDimensions.DBWrite] +
            INTRINSIC_INPUT_DB_WRITE +
            2 * INTRINSIC_OUTPUT_DB_WRITE,
          0, // TODO: Implement
        ),
      },

      {
        name: 'ImportTx',
        txHex:
          '00000000001100003039000000000000000000000000000000000000000000000000000000000000000000000001dbcf890f77f49b96857648b72b77f9f82937f28a68704af05da0dc12ba53f2db00000007000000003b8b87c0000000000000000100000001000000013cb7d3842e8cee6a0ebd09f1fe884f6861e1b29c0000000000000000d891ad56056d9c01f18f43f58b5c784ad07a4a49cf3d1f11623804b5cba2c6bf0000000163684415710a7d65f4ccb095edff59f897106b94d38937fc60e3ffc29892833b00000001dbcf890f77f49b96857648b72b77f9f82937f28a68704af05da0dc12ba53f2db00000005000000003b9aca00000000010000000000000001000000090000000148ea12cb0950e47d852b99765208f5a811d3c8a47fa7b23fd524bd970019d157029f973abb91c31a146752ef8178434deb331db24c8dca5e61c961e6ac2f3b6700',
        expectedComplexity: makeDimensions(
          335,
          INTRINSIC_IMPORT_TX_COMPLEXITIES[FeeDimensions.DBRead] +
            INTRINSIC_INPUT_DB_READ,
          INTRINSIC_IMPORT_TX_COMPLEXITIES[FeeDimensions.DBWrite] +
            INTRINSIC_INPUT_DB_WRITE +
            INTRINSIC_OUTPUT_DB_WRITE,
          0, // TODO: Implement
        ),
      },

      {
        name: 'TransferSubnetOwnershipTx',
        txHex:
          '00000000002100003039000000000000000000000000000000000000000000000000000000000000000000000001dbcf890f77f49b96857648b72b77f9f82937f28a68704af05da0dc12ba53f2db000000070023834e99bf1ec0000000000000000000000001000000013cb7d3842e8cee6a0ebd09f1fe884f6861e1b29c000000018f6e5f2840e34f9a375f35627a44bb0b9974285d280dc3220aa9489f97b17ebd00000000dbcf890f77f49b96857648b72b77f9f82937f28a68704af05da0dc12ba53f2db000000050023834e99ce610000000001000000000000000097ea88082100491617204ed70c19fc1a2fce4474bee962904359d0b59e84c1240000000a00000001000000000000000b00000000000000000000000000000000000000020000000900000001e3479034ed8134dd23e154e1ec6e61b25073a20750ebf808e50ec1aae180ef430f8151347afdf6606bc7866f7f068b01719e4dad12e2976af1159fb048f73f7f010000000900000001e3479034ed8134dd23e154e1ec6e61b25073a20750ebf808e50ec1aae180ef430f8151347afdf6606bc7866f7f068b01719e4dad12e2976af1159fb048f73f7f01',
        expectedComplexity: makeDimensions(
          436,
          INTRINSIC_TRANSFER_SUBNET_OWNERSHIP_TX_COMPLEXITIES[
            FeeDimensions.DBRead
          ] + INTRINSIC_INPUT_DB_READ,
          INTRINSIC_TRANSFER_SUBNET_OWNERSHIP_TX_COMPLEXITIES[
            FeeDimensions.DBWrite
          ] +
            INTRINSIC_INPUT_DB_WRITE +
            INTRINSIC_OUTPUT_DB_WRITE,
          0, // TODO: Implement
        ),
      },
    ])('$name', ({ txHex, expectedComplexity }) => {
      const txBytes = hexToBuffer(txHex);

      // console.log('txBytes length:', txBytes.length, '=== expected bandwidth');

      const tx = unpackWithManager(vm, txBytes);

      const result = txComplexity(tx);

      expect(result).toEqual(expectedComplexity);
    });

    test.each([
      {
        name: 'AddDelegatorTx',
        txHash:
          '00000000000e000000050000000000000000000000000000000000000000000000000000000000000000000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa00000007000000003b9aca0000000000000000000000000100000001f887b4c7030e95d2495603ae5d8b14cc0a66781a000000011767be999a49ca24fe705de032fa613b682493110fd6468ae7fb56bde1b9d729000000003d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa00000005000000012a05f20000000001000000000000000400000000c51c552c49174e2e18b392049d3e4cd48b11490f000000005f692452000000005f73b05200000000ee6b2800000000013d9bdac0ed1d761330cf680efdeb1a42159eb387d6d2950c96f7d28f61bbe2aa0000000700000000ee6b280000000000000000000000000100000001e0cfe8cae22827d032805ded484e393ce51cbedb0000000b00000000000000000000000100000001e0cfe8cae22827d032805ded484e393ce51cbedb00000001000000090000000135cd78758035ed528d230317e5d880083a86a2b68c4a95655571828fe226548f235031c8dabd1fe06366a57613c4370ac26c4c59d1a1c46287a59906ec41b88f00',
      },

      {
        name: 'AddValidatorTx',
        txHash:
          '00000000000c0000000100000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000f4b21e67317cbc4be2aeb00677ad6462778a8f52274b9d605df2591b23027a87dff00000015000000006134088000000005000001d1a94a200000000001000000000000000400000000b3da694c70b8bee4478051313621c3f2282088b4000000005f6976d500000000614aaa19000001d1a94a20000000000121e67317cbc4be2aeb00677ad6462778a8f52274b9d605df2591b23027a87dff00000016000000006134088000000007000001d1a94a20000000000000000000000000010000000120868ed5ac611711b33d2e4f97085347415db1c40000000b0000000000000000000000010000000120868ed5ac611711b33d2e4f97085347415db1c400009c40000000010000000900000001620513952dd17c8726d52e9e621618cb38f09fd194abb4cd7b4ee35ecd10880a562ad968dc81a89beab4e87d88d5d582aa73d0d265c87892d1ffff1f6e00f0ef00',
      },

      {
        name: 'RewardValidatorTx',
        txHash:
          '0000000000143d0ad12b8ee8928edf248ca91ca55600fb383f07c32bff1d6dec472b25cf59a700000000',
      },

      {
        name: 'AdvanceTimeTx',
        txHash: '0000000000130000000066a56fe700000000',
      },
    ])('unsupported tx - $name', ({ txHash }) => {
      const txBytes = hexToBuffer(txHash);

      const tx = unpackWithManager(vm, txBytes);

      expect(() => {
        txComplexity(tx);
      }).toThrow('Unsupported transaction type.');
    });
  });
});
