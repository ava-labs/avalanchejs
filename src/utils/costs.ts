import type { UnsignedTx } from '../vms/common/unsignedTx';

export const CTxBytesGas = 1n;
export const CCostPerSignature = 1000n;
export const CFixedFee = 10000;

export function costCorethTx(tx: UnsignedTx): bigint {
  const bytesCost = calcBytesCost(tx.toBytes().length);

  const sigCost =
    BigInt(tx.getSigIndices().flatMap((a) => a).length) * CCostPerSignature;
  const fixedFee = 10000n;
  return bytesCost + sigCost + fixedFee;
}

export function calcBytesCost(len: number): bigint {
  return BigInt(len) * CTxBytesGas;
}
