import { base58check } from '../../../../src/utils';

export const getRandomNodeId = (): string => {
  const buffer = new Uint8Array(20);
  const randomBuffer = crypto.getRandomValues(buffer);

  const nodeId = `NodeID-${base58check.encode(randomBuffer)}`;

  return nodeId;
};
