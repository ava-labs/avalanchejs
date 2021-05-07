import { ImportTx } from 'src/apis/evm/importtx';
import { Defaults } from 'src/utils/constants';
import { ONEAVAX } from '../../../src/utils/constants';
import { EVMOutput } from 'src/apis/evm';
import { 
  EVMFeeError,
  EVMOutputError 
} from 'src/utils/errors';


describe('EVM Transactions', () => {
  const cHexAddress: string = "0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC";
  const antAssetId: string = "F4MyJcUvq3Rxbqgd4Zs8sUpvwLHApyrp4yxJXe2bAV86Vvp38";
  const avaxAssetID: string = Defaults.network['12345'].X.avaxAssetID;
  const evmOutputs: EVMOutput[] = [];
  describe('ImportTx', (): void => {
    test("Multi AVAX EVMOutput fail", (): void => {
      // Creating 2 outputs with the same address and AVAX assetId is invalid in Apricot Phase 2
      // This should fail
      let evmOutput: EVMOutput = new EVMOutput(cHexAddress, ONEAVAX, avaxAssetID);
      evmOutputs.push(evmOutput);
      evmOutput = new EVMOutput(cHexAddress, ONEAVAX, avaxAssetID);
      evmOutputs.push(evmOutput);
      expect((): void => {
        try {
          new ImportTx(undefined, undefined, undefined, undefined, evmOutputs);
        } catch (error) {
          expect(error).toBeInstanceOf(EVMOutputError)
          expect(error.errorCode).toBe("1021")
          throw error;
        }
      }).toThrow("Error - ImportTx: duplicate (address, assetId) pair found in outputs: (0x8db97c7cece249c2b98bdc0226cc4c2a57bf52fc, 2fombhL7aGPwj3KH4bfrmJwW6PVnMobf9Y2fn9GwxiAAJyFDbe)");
    });

    test("Multi ANT EVMOutput fail", (): void => {
      // Creating 2 outputs with the same address and ANT assetId is invalid in Apricot Phase 2
      // This should fail
      let evmOutput: EVMOutput = new EVMOutput(cHexAddress, ONEAVAX, antAssetId);
      evmOutputs.push(evmOutput);
      evmOutput = new EVMOutput(cHexAddress, ONEAVAX, antAssetId);
      evmOutputs.push(evmOutput);
      expect((): void => {
        try {
          new ImportTx(undefined, undefined, undefined, undefined, evmOutputs);
        } catch (error) {
          expect(error).toBeInstanceOf(EVMOutputError)
          expect(error.errorCode).toBe("1021")
          throw error;
        }
      }).toThrow("Error - ImportTx: duplicate (address, assetId) pair found in outputs: (0x8db97c7cece249c2b98bdc0226cc4c2a57bf52fc, F4MyJcUvq3Rxbqgd4Zs8sUpvwLHApyrp4yxJXe2bAV86Vvp38)");
    });

    test("Single ANT EVMOutput fail", (): void => {
      // If the output is a non-avax assetID then don't subtract a fee
      // This should fail
      const evmOutput: EVMOutput = new EVMOutput(cHexAddress, ONEAVAX, antAssetId);
      evmOutputs.push(evmOutput);
      expect((): void => {
        try {
          new ImportTx(undefined, undefined, undefined, undefined, evmOutputs);
        } catch (error) {
          expect(error).toBeInstanceOf(EVMFeeError)
          expect(error.errorCode).toBe("1038")
          throw error;
        }
      }).toThrow("Error - 1000000 AVAX required for fee and only 0 AVAX provided");
    });

    test("Single underfunded AVAX EVMOutput", (): void => {
      const evmOutput: EVMOutput = new EVMOutput(cHexAddress, ONEAVAX, avaxAssetID);
      evmOutputs.push(evmOutput);
      expect((): void => {
        try {
          new ImportTx(undefined, undefined, undefined, undefined, evmOutputs);
        } catch (error) {
          expect(error).toBeInstanceOf(EVMFeeError)
          expect(error.errorCode).toBe("1038")
          throw error;
        }
      }).toThrow("Error - 1000000 AVAX required for fee and only -2 AVAX provided");
    });
  });
});
