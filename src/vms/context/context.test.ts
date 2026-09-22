import { describe, expect, it, vi, beforeEach } from 'vitest';

import { testContext } from '../../fixtures/context';
import { getContextFromURI } from './context';

/**
 * The RPC node is untrusted. getContextFromURI freezes its identifier strings
 * into a Context that every builder reuses for the whole session, and those
 * strings are base58-decoded on every transaction build. base58 decoding is
 * quadratic in the input length, so an unvalidated identifier lets the node
 * choose how long the caller's single JS thread blocks — on every build, not
 * just once. Validating at ingestion turns that into one prompt failure.
 */
const mocks = vi.hoisted(() => ({
  getAssetDescription: vi.fn(),
  getTxFee: vi.fn(),
  getBlockchainId: vi.fn(),
  getNetworkId: vi.fn(),
  getFeeConfig: vi.fn(),
}));

vi.mock('../avm/api', () => ({
  AVMApi: vi.fn(() => ({
    getAssetDescription: mocks.getAssetDescription,
    getTxFee: mocks.getTxFee,
  })),
}));

vi.mock('../../info', () => ({
  InfoApi: vi.fn(() => ({
    getBlockchainId: mocks.getBlockchainId,
    getNetworkId: mocks.getNetworkId,
  })),
}));

vi.mock('../pvm', () => ({
  PVMApi: vi.fn(() => ({ getFeeConfig: mocks.getFeeConfig })),
}));

const setNodeResponses = ({
  assetID = testContext.avaxAssetID,
  blockchainID = testContext.pBlockchainID,
}: { assetID?: string; blockchainID?: string } = {}) => {
  mocks.getAssetDescription.mockResolvedValue({ assetID });
  mocks.getTxFee.mockResolvedValue({
    txFee: testContext.baseTxFee,
    createAssetTxFee: testContext.createAssetTxFee,
  });
  mocks.getBlockchainId.mockResolvedValue({ blockchainID });
  mocks.getNetworkId.mockResolvedValue({ networkID: '1' });
  mocks.getFeeConfig.mockResolvedValue(testContext.platformFeeConfig);
};

describe('getContextFromURI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds a context from well-formed node responses', async () => {
    setNodeResponses();

    const context = await getContextFromURI('https://example.invalid');

    expect(context.avaxAssetID).toEqual(testContext.avaxAssetID);
    expect(context.pBlockchainID).toEqual(testContext.pBlockchainID);
  });

  it('rejects a multi-hundred-KB blockchainID promptly', async () => {
    setNodeResponses({ blockchainID: 'z'.repeat(50_000) });

    const started = Date.now();
    await expect(getContextFromURI('https://example.invalid')).rejects.toThrow(
      /invalid xBlockchainID/,
    );
    // Unbounded, this decode runs on every build and takes seconds each time.
    expect(Date.now() - started).toBeLessThan(1_000);
  });

  it('rejects a multi-hundred-KB assetID promptly', async () => {
    setNodeResponses({ assetID: 'z'.repeat(50_000) });

    const started = Date.now();
    await expect(getContextFromURI('https://example.invalid')).rejects.toThrow(
      /invalid avaxAssetID/,
    );
    expect(Date.now() - started).toBeLessThan(1_000);
  });

  it('rejects an identifier whose checksum does not match', async () => {
    const valid = testContext.pBlockchainID;
    const corrupted =
      valid.slice(0, 5) + (valid[5] === 'x' ? 'y' : 'x') + valid.slice(6);

    setNodeResponses({ blockchainID: corrupted });

    await expect(getContextFromURI('https://example.invalid')).rejects.toThrow(
      /invalid xBlockchainID/,
    );
  });
});
