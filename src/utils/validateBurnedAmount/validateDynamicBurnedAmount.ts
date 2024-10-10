/**
 * Validate dynamic burned amount for avalanche c/p transactions
 *
 * @param burnedAmount: burned amount in nAVAX
 * @param feeAmount: fee
 * @param feeTolerance: tolerance percentage range where the burned amount is considered valid. e.g.: with FeeTolerance = 20% -> (expectedFee <= burnedAmount <= expectedFee * 1.2)
 * @return {boolean} isValid: : true if the burned amount is valid, false otherwise.
 * @return {bigint} txFee: burned amount in nAVAX
 */
export const validateDynamicBurnedAmount = ({
  burnedAmount,
  feeAmount,
  feeTolerance,
}: {
  burnedAmount: bigint;
  feeAmount: bigint;
  feeTolerance: number;
}): { isValid: boolean; txFee: bigint } => {
  const feeToleranceInt = Math.floor(feeTolerance);

  if (feeToleranceInt < 1 || feeToleranceInt > 100) {
    throw new Error('feeTolerance must be [1,100]');
  }

  const min = (feeAmount * (100n - BigInt(feeToleranceInt))) / 100n;
  const max = (feeAmount * (100n + BigInt(feeToleranceInt))) / 100n;

  return {
    isValid: burnedAmount >= min && burnedAmount <= max,
    txFee: burnedAmount,
  };
};
