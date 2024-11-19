import { Bytes } from '../../../../serializable';
import { ID_LEN } from '../../../../serializable/fxs/common/id';
import { INT_LEN } from '../../../../serializable/primitives/int';
import { bufferToNumber } from '../../../../utils';

// TODO: Why is there this offset on the message? What are the first two bytes?
// Offset the start of deserialization because of some unknown bytes at the front.
const START_INDEX = 2;
// Offset for the WarpSignature type ID
const SIGNATURE_INDEX_OFFSET = 4;

/**
 * Calculates the number of `1`s (set bits) in the binary representation of a number.
 *
 * @param num
 * @returns The number of bits set to 1 in the binary representation of `num`
 */
const hammingWeight = (num: number): number => {
  let count = 0;
  while (num !== 0) {
    count += num & 1;
    num >>= 1;
  }
  return count;
};

/**
 * Takes a big-endian byte slice and returns the number of bits set to 1.
 *
 * This function iterates through each byte in the `Uint8Array` and calculates
 * the Hamming weight for each byte, summing up the results.
 *
 * @param bytes big-endian byte slice
 * @returns number of bits set to 1
 */
export const bitsFromBytesLength = (bytes: Uint8Array): number => {
  let count = 0;

  for (let i = 0; i < bytes.length; i++) {
    count += hammingWeight(bytes[i]);
  }

  return count;
};

/**
 * This is a very crude implementation of parsing the warp message
 * to get the number of signers out of it for calculating transaction
 * complexity. The implementation here is not meant to be the final one.
 *
 * Ideally, if Warp messages are added to AJS, we would want to use the
 * built-in deserialization methods to get the number of signers.
 *
 * @experimental This implementation risks breaking if Warp messages
 * change their structure.
 *
 * @internal
 *
 * @param message WarpMessage Bytes
 * @returns number of signers in the WarpMessage's WarpSignature
 */
export const getWarpMessageNumOfSigners = (messageBytes: Bytes): number => {
  const message = messageBytes.toBytes().slice(INT_LEN);

  const unsignedMessagePayloadBytesIndex =
    START_INDEX +
    INT_LEN + // networkId
    ID_LEN; // sourceChainId

  const unsignedMessagePayloadLength = bufferToNumber(
    message.slice(
      unsignedMessagePayloadBytesIndex,
      unsignedMessagePayloadBytesIndex + INT_LEN, // bytes length int
    ),
  );

  const signatureSignersBytesIndex =
    unsignedMessagePayloadBytesIndex +
    INT_LEN + // payload length bytes
    unsignedMessagePayloadLength + // payload length
    SIGNATURE_INDEX_OFFSET;

  // first 4 bytes are the BitSetSignature typeId
  const [signersBytes] = Bytes.fromBytes(
    message.slice(signatureSignersBytesIndex),
  );

  // `signers` is a big-endian byte slice
  const signers = signersBytes.toBytes().slice(INT_LEN);

  const numberOfSigners = bitsFromBytesLength(signers);

  return numberOfSigners;
};
