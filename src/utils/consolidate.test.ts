import { consolidate } from './consolidate';
import { describe, it, expect } from 'vitest';

describe('consolidate', () => {
  it('combines elements', () => {
    const arr = [true, false, true, false];
    const canCombine = (a: boolean, b: boolean) => a === b;
    const combine = (a: boolean) => a;

    const consolidated = consolidate(arr, canCombine, combine);

    expect(consolidated.length).toEqual(2);
    expect(consolidated[0]).toEqual(true);
    expect(consolidated[1]).toEqual(false);
  });

  it('preserves combining order', () => {
    const arr = [1, 2, 3, 4, 5, 6];
    const canCombine = (a: number, b: number) => a % 2 === 0 && b % 2 === 0;
    const combine = (a: number, b: number) => a + b;

    const consolidated = consolidate(arr, canCombine, combine);

    expect(consolidated.length).toEqual(4);
    expect(consolidated[0]).toEqual(1);
    expect(consolidated[1]).toEqual(12);
    expect(consolidated[2]).toEqual(3);
    expect(consolidated[3]).toEqual(5);
  });

  it('returns identical array if cannot combine anything', () => {
    const arr = [1, 2, 3, 4, 5, 6];
    const canCombine = () => false;
    const combine = (a: number, b: number) => a + b;

    const consolidated = consolidate(arr, canCombine, combine);

    expect(consolidated.length).toEqual(arr.length);
    expect(consolidated[0]).toEqual(1);
    expect(consolidated[1]).toEqual(2);
    expect(consolidated[2]).toEqual(3);
    expect(consolidated[3]).toEqual(4);
    expect(consolidated[4]).toEqual(5);
    expect(consolidated[5]).toEqual(6);
  });

  it('handles empty lists gracefully', () => {
    const arr: number[] = [];
    const canCombine = () => true;
    const combine = (a: number, b: number) => a + b;

    const consolidated = consolidate(arr, canCombine, combine);

    expect(consolidated.length).toEqual(arr.length);
  });
});
