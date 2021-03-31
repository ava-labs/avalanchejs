import { EVMOutput } from 'src/apis/evm';

describe('Inputs', () => {
  test('EVMOutput comparator', () => {
    const address1: string = "X-local1n8cjyy4hdw96dsvdsdf9mcuswu4wq333gqtfq2";
    const address2: string = "X-local17pm5mywjrdvkz8c3f25ll0tmshs900qf0wrwxc";
    const address3: string = "X-local1u9z02vhut6ur5gvt8xh2g3e4xaadt2h37u3zqe";
    const amount1: number = 1;
    const amount2: number = 2;
    const amount3: number = 3;
    const assetID1: string = "2fombhL7aGPwj3KH4bfrmJwW6PVnMobf9Y2fn9GwxiAAJyFDbe";
    const assetID2: string = "vvKCjrpggyQ8FhJ2D5EAKPh8x8y4JK93JQiWRpTKpEouydRbG";
    const assetID3: string = "eRo1eb2Yxd87KuMYANBSha3n138wtqRhFz2xjftsXWnmpCxyh";

    const output1: EVMOutput = new EVMOutput(address1, amount1, assetID1);
    const output2: EVMOutput = new EVMOutput(address2, amount2, assetID2);
    const output3: EVMOutput = new EVMOutput(address3, amount3, assetID3);

    const cmp = EVMOutput.comparator();
    expect(cmp(output1, output2)).toBe(-1);
    expect(cmp(output1, output3)).toBe(-1);
    expect(cmp(output2, output3)).toBe(-1);
    expect(cmp(output1, output1)).toBe(0);
    expect(cmp(output2, output2)).toBe(0);
    expect(cmp(output3, output3)).toBe(0);
    expect(cmp(output2, output1)).toBe(1);
    expect(cmp(output3, output1)).toBe(1);
    expect(cmp(output3, output2)).toBe(1);
  });
});
