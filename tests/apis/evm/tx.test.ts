import { ImportTx } from 'src/apis/evm';
import { Defaults } from 'src/utils/constants';
import { ONEAVAX } from '../../../src/utils/constants';
import { EVMOutput } from 'src/apis/evm';
import BN from "bn.js";

describe('EVM Transactions', () => {
  const cHexAddress1: string = "0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC";
  const cHexAddress2: string = "0xecC3B2968B277b837a81A7181e0b94EB1Ca54EdE";
  const antAssetID: string = "F4MyJcUvq3Rxbqgd4Zs8sUpvwLHApyrp4yxJXe2bAV86Vvp38";
  const avaxAssetID: string = Defaults.network['12345'].X.avaxAssetID;
  let evmOutputs: EVMOutput[];

  beforeEach((): void => {
    evmOutputs = [];
  });

  describe('ImportTx', () => {
    test("Multi AVAX EVMOutput fail", (): void => {
      // Creating 2 outputs with the same address and AVAX assetID is invalid
      let evmOutput: EVMOutput = new EVMOutput(cHexAddress1, ONEAVAX, avaxAssetID);
      evmOutputs.push(evmOutput);
      evmOutput = new EVMOutput(cHexAddress1, ONEAVAX, avaxAssetID);
      evmOutputs.push(evmOutput);

      expect((): void => {
        new ImportTx(undefined, undefined, undefined, undefined, evmOutputs);
      }).toThrow("Error - ImportTx: duplicate (address, assetId) pair found in outputs: (0x8db97c7cece249c2b98bdc0226cc4c2a57bf52fc, 2fombhL7aGPwj3KH4bfrmJwW6PVnMobf9Y2fn9GwxiAAJyFDbe)");
    });

    // test("Multi AVAX EVMOutput success", (): void => {
    //   // Creating 2 outputs with different addresses valid
    //   let evmOutput: EVMOutput = new EVMOutput(cHexAddress1, ONEAVAX, avaxAssetID);
    //   evmOutputs.push(evmOutput);
    //   evmOutput = new EVMOutput(cHexAddress2, ONEAVAX, avaxAssetID);
    //   evmOutputs.push(evmOutput);

    //   expect((): void => {
    //     new ImportTx(undefined, undefined, undefined, undefined, evmOutputs);
    //   }).toThrow("Error - ImportTx: duplicate (address, assetId) pair found in outputs: (0x8db97c7cece249c2b98bdc0226cc4c2a57bf52fc, 2fombhL7aGPwj3KH4bfrmJwW6PVnMobf9Y2fn9GwxiAAJyFDbe)");
    // });

    test("Multi ANT EVMOutput fail", (): void => {
      // Creating 2 outputs with the same address and ANT assetID is invalid
      let evmOutput: EVMOutput = new EVMOutput(cHexAddress1, ONEAVAX, antAssetID);
      evmOutputs.push(evmOutput);
      evmOutput = new EVMOutput(cHexAddress1, ONEAVAX, antAssetID);
      evmOutputs.push(evmOutput);
      expect((): void => {
        new ImportTx(undefined, undefined, undefined, undefined, evmOutputs);
      }).toThrow("Error - ImportTx: duplicate (address, assetId) pair found in outputs: (0x8db97c7cece249c2b98bdc0226cc4c2a57bf52fc, F4MyJcUvq3Rxbqgd4Zs8sUpvwLHApyrp4yxJXe2bAV86Vvp38)");
    });

    test("Single AVAX EVMOutput fail", (): void => {
      const evmOutput: EVMOutput = new EVMOutput(cHexAddress1, new BN(0), avaxAssetID);
      evmOutputs.push(evmOutput);
      expect((): void => {
        new ImportTx(undefined, undefined, undefined, undefined, evmOutputs);
      }).toThrow("Error - 1000000 AVAX required for fee and only 0 AVAX provided");
    });


    test("Single ANT EVMOutput fail", (): void => {
      // If the output is a non-avax assetID then don't subtract a fee
      const evmOutput: EVMOutput = new EVMOutput(cHexAddress1, ONEAVAX, antAssetID);
      evmOutputs.push(evmOutput);
      expect((): void => {
        new ImportTx(undefined, undefined, undefined, undefined, evmOutputs);
      }).toThrow("Error - 1000000 AVAX required for fee and only 0 AVAX provided");
    });

  //   test("Single underfunded AVAX EVMOutput", (): void => {
  //     const evmOutput: EVMOutput = new EVMOutput(cHexAddress, ONEAVAX, avaxAssetID);
  //     evmOutputs.push(evmOutput);
  //     expect((): void => {
  //       new ImportTx(undefined, undefined, undefined, undefined, evmOutputs);
  //     }).toThrow("Error - 1000000 AVAX required for fee and only -2 AVAX provided");
  //   });
  });
});
