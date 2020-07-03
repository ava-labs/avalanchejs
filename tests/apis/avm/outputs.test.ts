import BN from 'bn.js';
import { Buffer } from 'buffer/';
import BinTools from 'src/utils/bintools';
import { Output, SecpOutput, SelectOutputClass } from 'src/apis/avm/outputs';

const bintools = BinTools.getInstance();

describe('Outputs', () => {
  const assetID:string = '8a5d2d32e68bc50036e4d086044617fe4a0a0296b274999ba568ea92da46d533';
  const assetIDBuff:Buffer = Buffer.from(assetID, 'hex');
  const addrs:Array<Buffer> = [
    bintools.avaDeserialize('B6D4v1VtPYLbiUvYXtW4Px8oE9imC2vGW'),
    bintools.avaDeserialize('P5wdRuZeaDt28eHMP5S3w9ZdoBfo7wuzF'),
    bintools.avaDeserialize('6Y3kysjF9jnHnYkdS9yGAuoHyae2eNmeV'),
  ].sort();

  const locktime:BN = new BN(54321);
  const addrpay = [addrs[0], addrs[1]];
  const addrfall = [addrs[1], addrs[2]];
  const fallLocktime:BN = locktime.add(new BN(50));

  test('SelectOutputClass', () => {
    const goodout:SecpOutput = new SecpOutput(new BN(2600), locktime, 1, addrpay);
    const outpayment:Output = SelectOutputClass(goodout.getOutputID());
    expect(outpayment).toBeInstanceOf(SecpOutput);
    expect(() => {
      SelectOutputClass(99);
    }).toThrow('Error - SelectOutputClass: unknown outputid');
  });

  test('comparator', () => {
    const outpayment1:Output = new SecpOutput(new BN(10000), locktime, 3, addrs);
    const outpayment2:Output = new SecpOutput(new BN(10001), locktime, 3, addrs);
    const outpayment3:Output = new SecpOutput(new BN(9999), locktime, 3, addrs);
    const cmp = Output.comparator();
    expect(cmp(outpayment1, outpayment1)).toBe(0);
    expect(cmp(outpayment2, outpayment2)).toBe(0);
    expect(cmp(outpayment3, outpayment3)).toBe(0);
    expect(cmp(outpayment1, outpayment2)).toBe(-1);
    expect(cmp(outpayment1, outpayment3)).toBe(1);
  });
  test('SecpOutput', () => {
    const out:SecpOutput = new SecpOutput(new BN(10000), locktime, 3, addrs);
    expect(out.getOutputID()).toBe(7);
    expect(JSON.stringify(out.getAddresses().sort())).toStrictEqual(JSON.stringify(addrs.sort()));

    expect(out.getThreshold()).toBe(3);
    expect(out.getLocktime().toNumber()).toBe(locktime.toNumber());

    const r = out.getAddressIdx(addrs[2]);
    expect(out.getAddress(r)).toStrictEqual(addrs[2]);
    expect(() => {
      out.getAddress(400);
    }).toThrow();

    expect(out.getAmount().toNumber()).toBe(10000);

    const b:Buffer = out.toBuffer();
    expect(out.toString()).toBe(bintools.bufferToB58(b));

    const s:Array<Buffer> = out.getSpenders(addrs);
    expect(JSON.stringify(s.sort())).toBe(JSON.stringify(addrs.sort()));

    const m1:boolean = out.meetsThreshold([addrs[0]]);
    expect(m1).toBe(false);
    const m2:boolean = out.meetsThreshold(addrs, new BN(100));
    expect(m2).toBe(false);
    const m3:boolean = out.meetsThreshold(addrs);
    expect(m3).toBe(true);
    const m4:boolean = out.meetsThreshold(addrs, locktime.add(new BN(100)));
    expect(m4).toBe(true);
  });
});
