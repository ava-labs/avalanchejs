export enum FeeDimensions {
  Bandwidth = 0,
  DBRead = 1,
  DBWrite = 2,
  Compute = 3,
}

type DimensionValue = number;

export type Dimensions = Record<FeeDimensions, DimensionValue>;

export const createEmptyDimensions = (): Dimensions => ({
  [FeeDimensions.Bandwidth]: 0,
  [FeeDimensions.DBRead]: 0,
  [FeeDimensions.DBWrite]: 0,
  [FeeDimensions.Compute]: 0,
});

export const createDimensions = ({
  bandwidth,
  dbRead,
  dbWrite,
  compute,
}: {
  bandwidth: DimensionValue;
  dbRead: DimensionValue;
  dbWrite: DimensionValue;
  compute: DimensionValue;
}): Dimensions => ({
  [FeeDimensions.Bandwidth]: bandwidth,
  [FeeDimensions.DBRead]: dbRead,
  [FeeDimensions.DBWrite]: dbWrite,
  [FeeDimensions.Compute]: compute,
});

/**
 * Adds a number of dimensions together.
 *
 * @returns The sum of the dimensions.
 */
export const addDimensions = (...dimensions: Dimensions[]): Dimensions => {
  const result = createEmptyDimensions();
  for (const dimension of dimensions) {
    result[FeeDimensions.Bandwidth] += dimension[FeeDimensions.Bandwidth];
    result[FeeDimensions.DBRead] += dimension[FeeDimensions.DBRead];
    result[FeeDimensions.DBWrite] += dimension[FeeDimensions.DBWrite];
    result[FeeDimensions.Compute] += dimension[FeeDimensions.Compute];
  }
  return result;
};

export const dimensionsToGas = (
  dimensions: Dimensions,
  weights: Dimensions,
): bigint => {
  return BigInt(
    dimensions[FeeDimensions.Bandwidth] * weights[FeeDimensions.Bandwidth] +
      dimensions[FeeDimensions.DBRead] * weights[FeeDimensions.DBRead] +
      dimensions[FeeDimensions.DBWrite] * weights[FeeDimensions.DBWrite] +
      dimensions[FeeDimensions.Compute] * weights[FeeDimensions.Compute],
  );
};
