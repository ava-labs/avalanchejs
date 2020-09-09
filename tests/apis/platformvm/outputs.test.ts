import BN from 'bn.js';
import { Buffer } from 'buffer/';
import BinTools from 'src/utils/bintools';
import { SECPTransferOutput, SelectOutputClass } from 'src/apis/platformvm/outputs';
import { Output } from 'src/common/output';

const bintools = BinTools.getInstance();

describe('Outputs', () => {

    describe('SECPTransferOutput', () => {
      let addrs:Array<Buffer> = [
          bintools.cb58Decode("B6D4v1VtPYLbiUvYXtW4Px8oE9imC2vGW"),
          bintools.cb58Decode("P5wdRuZeaDt28eHMP5S3w9ZdoBfo7wuzF"),
          bintools.cb58Decode("6Y3kysjF9jnHnYkdS9yGAuoHyae2eNmeV")
      ].sort();

      let locktime:BN = new BN(54321);
      let addrpay = [addrs[0], addrs[1]];
      let fallLocktime:BN = locktime.add(new BN(50));

      test('SelectOutputClass', () => {
          let goodout:SECPTransferOutput = new SECPTransferOutput(new BN(2600), addrpay, fallLocktime, 1);
          let outpayment:Output = SelectOutputClass(goodout.getOutputID());
          expect(outpayment).toBeInstanceOf(SECPTransferOutput);
          expect(() => {
              SelectOutputClass(99);
          }).toThrow("Error - SelectOutputClass: unknown outputid");
      });

      test('comparator', () => {
          let outpayment1:Output = new SECPTransferOutput(new BN(10000), addrs, locktime, 3);
          let outpayment2:Output = new SECPTransferOutput(new BN(10001), addrs, locktime, 3);
          let outpayment3:Output = new SECPTransferOutput(new BN(9999), addrs, locktime, 3);
          let cmp = Output.comparator();
          expect(cmp(outpayment1, outpayment1)).toBe(0);
          expect(cmp(outpayment2, outpayment2)).toBe(0);
          expect(cmp(outpayment3, outpayment3)).toBe(0);
          expect(cmp(outpayment1, outpayment2)).toBe(-1);
          expect(cmp(outpayment1, outpayment3)).toBe(1);
      });

      test('SECPTransferOutput', () => {
          let out:SECPTransferOutput = new SECPTransferOutput(new BN(10000), addrs, locktime, 3);
          expect(out.getOutputID()).toBe(7);
          expect(JSON.stringify(out.getAddresses().sort())).toStrictEqual(JSON.stringify(addrs.sort()));

          expect(out.getThreshold()).toBe(3);
          expect(out.getLocktime().toNumber()).toBe(locktime.toNumber());

          let r = out.getAddressIdx(addrs[2]);
          expect(out.getAddress(r)).toStrictEqual(addrs[2]);
          expect(() => {
              out.getAddress(400)
          }).toThrow();

          expect(out.getAmount().toNumber()).toBe(10000);

          let b:Buffer = out.toBuffer();
          expect(out.toString()).toBe(bintools.bufferToB58(b));

          let s:Array<Buffer> = out.getSpenders(addrs);
          expect(JSON.stringify(s.sort())).toBe(JSON.stringify(addrs.sort()));

          let m1:boolean = out.meetsThreshold([addrs[0]]);
          expect(m1).toBe(false);
          let m2:boolean = out.meetsThreshold(addrs, new BN(100));
          expect(m2).toBe(false);
          let m3:boolean = out.meetsThreshold(addrs);
          expect(m3).toBe(true);
          let m4:boolean = out.meetsThreshold(addrs, locktime.add(new BN(100)));
          expect(m4).toBe(true);
      });
    });
});
