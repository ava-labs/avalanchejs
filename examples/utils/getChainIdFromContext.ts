import type { Context } from '../../src/vms/context';

export function getChainIdFromContext(
  sourceChain: 'X' | 'P' | 'C',
  context: Context,
) {
  return sourceChain === 'C'
    ? context.cBlockchainID
    : sourceChain === 'P'
    ? context.pBlockchainID
    : context.xBlockchainID;
}
