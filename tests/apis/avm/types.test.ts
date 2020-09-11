import { Buffer } from 'buffer/';
import BinTools from 'src/utils/bintools';
import { SigIdx, Signature } from 'src/common/credentials';
import { Address } from 'src/common/output';
import { UnixNow } from 'src/utils/helperfunctions';



const bintools:BinTools = BinTools.getInstance();

describe('UnixNow', () => {
  test('Does it return the right time?', () => {
    const now = Math.round((new Date()).getTime() / 1000);
    const unow = UnixNow();
    expect(now / 10).toBeCloseTo(unow.divn(10).toNumber(), -1);
  });
});

describe('Signature & NBytes', () => {
  const sig = new Signature();
  const sigpop:Array<number> = [];
  for (let i:number = 0; i < sig.getSize(); i++) {
    sigpop[i] = i;
  }
  const sigbuff:Buffer = Buffer.from(sigpop);
  const size = sig.fromBuffer(sigbuff);
  expect(sig.getSize()).toBe(size);
  expect(size).toBe(sig.getSize());
  const sigbuff2:Buffer = sig.toBuffer();
  for (let i:number = 0; i < sigbuff.length; i++) {
    expect(sigbuff2[i]).toBe(sigbuff[i]);
  }
  const sigbuffstr:string = bintools.bufferToB58(sigbuff);
  expect(sig.toString()).toBe(sigbuffstr);
  sig.fromString(sigbuffstr);
  expect(sig.toString()).toBe(sigbuffstr);
});

describe('SigIdx', () => {
  const sigidx:SigIdx = new SigIdx();
  expect(sigidx.getSize()).toBe(sigidx.toBuffer().length);
  sigidx.setSource(Buffer.from('abcd', 'hex'));
  expect(sigidx.getSource().toString('hex')).toBe('abcd');
});

describe('Address', () => {
  const addr1 = new Address();
  const addr2 = new Address();
  const smaller:Array<number> = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
  const bigger:Array<number> = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1];
  const addr1bytes:Buffer = Buffer.from(smaller);
  const addr2bytes:Buffer = Buffer.from(bigger);
  addr1.fromBuffer(addr1bytes);
  addr2.fromBuffer(addr2bytes);
  expect(Address.comparator()(addr1, addr2)).toBe(-1);
  expect(Address.comparator()(addr2, addr1)).toBe(1);

  const addr2str:string = addr2.toString();

  addr2.fromBuffer(addr1bytes);
  expect(Address.comparator()(addr1, addr2)).toBe(0);

  addr2.fromString(addr2str);
  expect(Address.comparator()(addr1, addr2)).toBe(-1);
  const a1b:Buffer = addr1.toBuffer();
  const a1s:string = bintools.bufferToB58(a1b);
  addr2.fromString(a1s);
  expect(Address.comparator()(addr1, addr2)).toBe(0);

  const badbuff:Buffer = bintools.copyFrom(addr1bytes);
  let badbuffout:Buffer = Buffer.concat([badbuff, Buffer.from([1, 2])]);
  let badstr:string = bintools.bufferToB58(badbuffout);
  const badaddr:Address = new Address();

  expect(() => {
    badaddr.fromString(badstr);
  }).toThrow('Error - Address.fromString: invalid address');

  badbuffout = Buffer.concat([badbuff, Buffer.from([1, 2, 3, 4])]);
  badstr = bintools.bufferToB58(badbuffout);
  expect(() => {
    badaddr.fromString(badstr);
  }).toThrow('Error - Address.fromString: invalid checksum on address');
});
