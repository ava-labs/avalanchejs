import type { GetUpgradesInfoResponse } from '../info/model';

export const isEtnaEnabled = (
  upgradesInfo: GetUpgradesInfoResponse,
): boolean => {
  const { etnaTime } = upgradesInfo;
  return new Date(etnaTime) < new Date();
};
