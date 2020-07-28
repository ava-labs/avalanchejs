import BinTools from 'src/utils/bintools';
import BN from 'bn.js';
import { Buffer } from 'buffer/';

const bintools = BinTools.getInstance();

describe('BinTools', () => {
  const hexstr:string = '00112233445566778899aabbccddeeff';
  const hexstr2:string = '0001020304050607080909080706050403020100';
  const hexstr3:string = '0001020304050607080909080706050403020101';
  const hexbuffstr1:string = '000461736466'; // = asdf
  const hexbuffstr2:string = '000761626364656667'; // = abcdefg
  const hexbuffstr3:string = '00076f6b0066696e65'; // = ok<null>fineokfine
  const b58str:string = '1UoWww8DGaVGLtea7zU7p';
  const b58str2:string = '1Bhh3pU9gLXZiJv73kmqZwHJ4F';
  const b58str3:string = '1Bhh3pU9gLXZiJv73kmqZwHJ4G';
  const buff:Buffer = Buffer.from(hexstr, 'hex');
  const buff2:Buffer = Buffer.from(hexstr2, 'hex');
  const buff3:Buffer = Buffer.from(hexstr3, 'hex');
  const checksum:string = '323e6811';
  const serializedChecksum:string = '148vjpuxYXixb8DcbaWyeDE2fEG'; // serialized hexstr + checksum
  test('copyFrom conducts a true copy', () => {
    const buff:Buffer = Buffer.from(hexstr, 'hex');
    const newbuff:Buffer = bintools.copyFrom(buff, 0, 10);
    expect(newbuff.length).toBe(10);
    expect(newbuff.readUInt8(0)).toBe(0);
    expect(newbuff.readUInt8(9)).toBe(153);
    // verify that the original buffer isn't touched by writes
    newbuff.writeUInt8(153, 4);
    expect(newbuff.readUInt8(4)).toBe(153);
    expect(buff.readUInt8(4)).toBe(68);
    // test with no end specified
    const newbuff2:Buffer = bintools.copyFrom(buff, 2);
    expect(newbuff2.length).toBe(14);
    expect(newbuff2.readUInt8(0)).toBe(34);
    expect(newbuff2.readUInt8(7)).toBe(153);
  });

  test('bufferToString', () => {
    const bres:string = bintools.bufferToString(Buffer.from(hexbuffstr1, 'hex'));
    expect(bres).toBe(Buffer.from(hexbuffstr1.slice(4), 'hex').toString('utf8'));
    // testing null character edge case
    const bres2:string = bintools.bufferToString(Buffer.from(hexbuffstr2, 'hex'));
    expect(bres2).toBe(Buffer.from(hexbuffstr2.slice(4), 'hex').toString('utf8'));
    // testing null character edge case
    const bres3:string = bintools.bufferToString(Buffer.from(hexbuffstr3, 'hex'));
    expect(bres3).toBe(Buffer.from(hexbuffstr3.slice(4), 'hex').toString('utf8'));
  });

  test('stringToBuffer', () => {
    const bres:Buffer = bintools.stringToBuffer('asdf');
    expect(bres.slice(2).toString()).toBe(Buffer.from(hexbuffstr1.slice(4), 'hex').toString('utf8'));
    // testing null character edge case
    const bres2:Buffer = bintools.stringToBuffer('abcdefg');
    expect(bres2.slice(2).toString()).toBe(Buffer.from(hexbuffstr2.slice(4), 'hex').toString('utf8'));
    // testing null character edge case
    const bres3:Buffer = bintools.stringToBuffer(Buffer.from(hexbuffstr3.slice(4), 'hex').toString('utf8'));
    expect(bres3.slice(2).toString()).toBe(Buffer.from(hexbuffstr3.slice(4), 'hex').toString('utf8'));
  });

  test('bufferToB58', () => {
    const b58res:string = bintools.bufferToB58(buff);
    expect(b58res).toBe(b58str);
    // testing null character edge case
    const b58res2:string = bintools.bufferToB58(buff2);
    expect(b58res2).toBe(b58str2);
    // testing null character edge case
    const b58res3:string = bintools.bufferToB58(buff3);
    expect(b58res3).toBe(b58str3);
  });

  test('b58ToBuffer', () => {
    expect(() => {
      bintools.b58ToBuffer('0OO0O not a valid b58 string 0OO0O');
    }).toThrow('Error - Base58.decode: not a valid base58 string');

    const buffres:Buffer = bintools.b58ToBuffer(b58str);
    expect(buffres.toString()).toBe(buff.toString());
    // testing zeros character edge case
    const buffres2:Buffer = bintools.b58ToBuffer(b58str2);
    expect(buffres2.toString()).toBe(buff2.toString());
    // testing zeros character edge case
    const buffres3:Buffer = bintools.b58ToBuffer(b58str3);
    expect(buffres3.toString()).toBe(buff3.toString());
  });

  test('fromBufferToArrayBuffer', () => {
    const arrbuff:ArrayBuffer = bintools.fromBufferToArrayBuffer(buff);
    expect(arrbuff.byteLength).toBe(buff.length);
    for (let i:number = 0; i < buff.length; i++) {
      expect(arrbuff[i]).toBe(buff[i]);
    }
    // verify that the original buffer isn't touched by writes
    arrbuff[2] = 55;
    expect(buff[2]).not.toBe(55);
  });

  test('fromArrayBufferToBuffer', () => {
    const arrbuff:ArrayBuffer = new ArrayBuffer(10);
    for (let i:number = 0; i < 10; i++) {
      arrbuff[i] = i;
    }
    const newbuff:Buffer = bintools.fromArrayBufferToBuffer(arrbuff);
    expect(newbuff.length).toBe(arrbuff.byteLength);
    for (let i:number = 0; i < newbuff.length; i++) {
      expect(newbuff[i]).toBe(arrbuff[i]);
    }
    // verify that the original buffer isnt touched by writes
    newbuff[3] = 55;
    expect(arrbuff[3]).not.toBe(newbuff[3]);
  });

  test('fromBufferToBN', () => {
    const bign:BN = bintools.fromBufferToBN(buff);
    expect(bign.toString('hex', hexstr.length)).toBe(hexstr);
  });

  test('fromBNToBuffer', () => {
    const bn1:BN = new BN(hexstr, 'hex', 'be');
    const bn2:BN = new BN(hexstr, 'hex', 'be');
    const b1:Buffer = bintools.fromBNToBuffer(bn1);
    const b2:Buffer = bintools.fromBNToBuffer(bn2, buff.length);

    expect(b1.length).toBe(buff.length - 1);
    expect(b1.toString('hex')).toBe(hexstr.slice(2));

    expect(b2.length).toBe(buff.length);
    expect(b2.toString('hex')).toBe(hexstr);
  });

  test('addChecksum', () => {
    const buffchecked:Buffer = bintools.addChecksum(buff);
    expect(buffchecked.length).toBe(buff.length + 4);
    expect(buffchecked.slice(16).toString('hex')).toBe(checksum);
  });

  test('validteChecksum', () => {
    const checksummed:string = hexstr + checksum;
    const badsummed:string = `${hexstr}324e7822`;
    expect(bintools.validateChecksum(Buffer.from(checksummed, 'hex'))).toBe(true);
    expect(bintools.validateChecksum(buff)).toBe(false);
    expect(bintools.validateChecksum(Buffer.from(badsummed, 'hex'))).toBe(false);
  });

  test('cb58Encode', () => {
    const fromBuff:string = bintools.cb58Encode(buff);
    expect(fromBuff).toBe(serializedChecksum);
  });

  test('cb58Decode', () => {
    const serbuff:Buffer = bintools.b58ToBuffer(serializedChecksum);
    const dsr1:Buffer = bintools.cb58Decode(serializedChecksum);
    const dsr2:Buffer = bintools.cb58Decode(serbuff);
    const serbufffaulty:Buffer = bintools.copyFrom(serbuff);
    serbufffaulty[serbufffaulty.length - 1] = serbufffaulty[serbufffaulty.length - 1] - 1;
    expect(dsr1.toString('hex')).toBe(hexstr);
    expect(dsr2.toString('hex')).toBe(hexstr);
    expect(() => {
      bintools.cb58Decode(serbufffaulty);
    }).toThrow('Error - BinTools.cb58Decode: invalid checksum');
  });
});
