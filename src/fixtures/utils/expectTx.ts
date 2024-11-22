import { expect } from 'vitest';

export const expectTxs = (result: any, expected: any) => {
  expect(JSON.stringify(result, null, 2)).toEqual(
    JSON.stringify(expected, null, 2),
  );
};
