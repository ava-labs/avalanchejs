import pkg from 'benchmark';
const { Suite } = pkg;

const contenders = {
  current: () => {
    const arr: number[] = [];
    for (let i = 0; i < 10000; i++) {
      arr.push(i);
    }
    return arr;
  },
  new: () => {
    return new Array(...new Array(10000).keys());
  },
};

console.log('Benchmark:');
const bench = new Suite().on('cycle', (e) => {
  console.log('  ' + e.target);
});

Object.keys(contenders).forEach((name) => {
  bench.add(name + ' '.repeat(28 - name.length), () => {
    contenders[name]();
  });
});

bench.run();
