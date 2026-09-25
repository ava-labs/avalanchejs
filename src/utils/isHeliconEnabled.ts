import type { GetUpgradesInfoResponse } from '../info/model';

export const isHeliconEnabled = (
  upgradesInfo: GetUpgradesInfoResponse,
): boolean => {
  const { heliconTime } = upgradesInfo;
  return new Date(heliconTime) < new Date();
};
