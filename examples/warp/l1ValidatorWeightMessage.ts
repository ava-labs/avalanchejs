import { utils } from '../../src';
import { pvmSerial } from '../../src/serializable';

/**
 * Structure of the message:
 * WarpSignedMessage
 *  - WarpUnsignedMessage
 *    - NetworkId
 *    - SourceChainId
 *    - AddressedCallPayload
 *      - SourceAddress
 *      - L1ValidatorWeightMessage
 *  - BitSet Signatures
 */

// Ref: See tx hash (on Fuji - PChain) zphUhqvXtj8dkYxg2BqCdTPDUPWBJUQkb1XTp38u8zDZ9VjMW
const signedWarpMsgHex =
  '0000000000056b804f574b890cf9e0cb0f0f68591a394bba1696cf62b4e576e793d8509cc88600000058000000000001000000140feedc0de0000000000000000000000000000000000000360000000000038ccf9ef520784d2fa5d97fbf098b8b4e82ff19408ec423c2970a522ab04b3a0400000000000000040000000000000029000000000000000106a8206d76cf3fa7d65fec8464b0311dce9283d05bcf0ca7987cdf03a3a2f764691e01df4f6aaa3ff6b52e5b92fd3291e519f3fb50bad5d9697a39e34e2c3e99ea585f0332e9d13b4b6db7ecc58eee44c7f96e64371b1eebaa6f7c45bbf0937e68';

const warpManager = pvmSerial.warp.getWarpManager();

const parsedWarpMsg = warpManager.unpack(
  utils.hexToBuffer(signedWarpMsgHex),
  pvmSerial.warp.WarpMessage,
);

console.log('Network ID:', parsedWarpMsg.unsignedMessage.networkId.value());
console.log(
  'Source Chain ID:',
  parsedWarpMsg.unsignedMessage.sourceChainId.value(),
);

const addressedCall = warpManager.unpack(
  parsedWarpMsg.unsignedMessage.payload.bytes,
  pvmSerial.warp.AddressedCallPayloads.AddressedCall,
);

console.log('Source Address:', addressedCall.getSourceAddress());

const l1VldrWeightMsg = warpManager.unpack(
  addressedCall.payload.bytes,
  pvmSerial.warp.AddressedCallPayloads.L1ValidatorWeightMessage,
);

console.log(l1VldrWeightMsg);
