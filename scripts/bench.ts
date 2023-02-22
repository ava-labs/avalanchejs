import { run, mark } from 'micro-bmark';

run(async () => {
  await mark('for loop', () => {
    const arr: number[] = [];
    for (let i = 0; i < 10000; i++) {
      arr.push(i);
    }
    return arr;
  });

  await mark('keys()', () => {
    return new Array(...new Array(10000).keys());
  });
});
