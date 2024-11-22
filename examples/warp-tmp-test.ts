import type { L1ValidatorWeight } from '../src/serializable/pvm/warp';
import type { AddressedCall } from '../src/serializable/pvm/warp';
import {
  getWarpManager,
  WarpUnsignedMessage,
} from '../src/serializable/pvm/warp';
import { getWarpMessageManager } from '../src/serializable/pvm/warp/message/';
import { getWarpPayloadManager } from '../src/serializable/pvm/warp/payload';
import { hexToBuffer } from '../src/utils/buffer';

const main = () => {
  const unsignedMessageHex =
    '0000004c00000000000000000000000000000000000000000000000000000000000000000000000000010000000000000036000000000003ab1644a54f81d7722005b0d5c20d4d1fb072f826be080895d604b74e2336bda2000000000000000e000000000000000f';
  const unsignedMessageBytes = hexToBuffer(unsignedMessageHex);
  const [unsignedMessage] = WarpUnsignedMessage.fromBytes(
    unsignedMessageBytes,
    getWarpManager().getDefaultCodec(),
  );

  console.log(unsignedMessage);

  const warpPayloadManager = getWarpPayloadManager();
  const addressedCall = warpPayloadManager.unpackPrefix<AddressedCall>(
    unsignedMessage.payload,
  );

  console.log(addressedCall);

  const warpMessageManager = getWarpMessageManager();
  const message = warpMessageManager.unpackPrefix<L1ValidatorWeight>(
    addressedCall.payload.bytes,
  );

  console.log(message);
};

main();
