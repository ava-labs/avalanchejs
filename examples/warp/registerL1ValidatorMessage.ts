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
 *      - RegisterL1ValidatorMessage
 *  - BitSet Signatures
 */

// Ref: See tx hash (on Fuji - PChain) qKx5qy1zriGsWGhnRfHibE9kuDSUMfQV7gPQVCQ8iBKT5ZriV
const signedWarpMsgHex =
  '0x0000000000057f78fe8ca06cefa186ef29c15231e45e1056cd8319ceca0695ca61099e610355000000d80000000000010000001433b9785e20ec582d5009965fb3346f1716e8a423000000b60000000000015e8b6e2e8155e93739f2fa6a7f8a32c6bb2e1dce2e471b56dcc60aac49bf34350000001447b37278e32917ffc6d2861b50dd9751b4016dd1b0d305fd70c376b0f5d4e6b9184728dcacb7390f477015690133a5632affab5701e9ebe61038d2e41373de53f4569fd60000000067d1ac310000000100000001380c1fb1db38f176b50e77eca240258e31a5b5e80000000100000001380c1fb1db38f176b50e77eca240258e31a5b5e80000000000004e200000000000000003c4411899be0450aee4dcc1be90a8802bdbd12821a5025a74cb094ff0033982e7f3951d6c4b882a6ce39bd2aa835b31accd09c60f26bc75308af4e05c4237df9b72b04c2697c5a0a7fb0f05f7b09358743a4a2df8cd4eda61f0dea0312a7014baa8a5c1';

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

const registerL1ValidatorMsg = warpManager.unpack(
  addressedCall.payload.bytes,
  pvmSerial.warp.AddressedCallPayloads.RegisterL1ValidatorMessage,
);

console.log(registerL1ValidatorMsg);
