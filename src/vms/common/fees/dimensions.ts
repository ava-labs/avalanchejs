/**
 * @see https://github.com/ava-labs/avalanchego/blob/13a3f103fd12df1e89a60c0c922b38e17872c6f6/vms/components/fee/dimensions.go#L10-L16
 */
export enum FeeDimensions {
  Bandwidth = 0,
  DBRead = 1,
  DBWrite = 2,
  Compute = 3,
}

export type Dimensions = Record<FeeDimensions, bigint>;

export const emptyDimensions = (): Dimensions => ({
  [FeeDimensions.Bandwidth]: BigInt(0),
  [FeeDimensions.DBRead]: BigInt(0),
  [FeeDimensions.DBWrite]: BigInt(0),
  [FeeDimensions.Compute]: BigInt(0),
});

/**
 * @see https://github.com/ava-labs/avalanchego/blob/13a3f103fd12df1e89a60c0c922b38e17872c6f6/vms/platformvm/txs/fee/dynamic_config.go#L24
 */
export const FeeDimensionWeights: Dimensions = {
  [FeeDimensions.Bandwidth]: BigInt(1),
  [FeeDimensions.DBRead]: BigInt(1),
  [FeeDimensions.DBWrite]: BigInt(1),
  [FeeDimensions.Compute]: BigInt(1),
};

export const toGas = (
  complexities: Dimensions,
  weights: Dimensions,
): bigint => {
  return Object.entries(complexities).reduce(
    (agg, [feeDimension, complexity]) =>
      agg + complexity * weights[feeDimension],
    0n,
  );
};
