export const bytesCompare = (a: Uint8Array, b: Uint8Array) => {
  let i;
  for (i = 0; i < a.length && i < b.length; i++) {
    const aByte = a[i];
    const bByte = b[i];
    if (aByte !== bByte) {
      return aByte - bByte;
    }
  }
  if (i === a.length && i === b.length) {
    // throw error?
    return 0;
  }
  return i === a.length ? -1 : 1;
};

export const bytesEqual = (bytes1: Uint8Array, bytes2: Uint8Array): boolean => {
  if (bytes1.length !== bytes2.length) {
    return false;
  }
  return bytesCompare(bytes1, bytes2) === 0;
};
