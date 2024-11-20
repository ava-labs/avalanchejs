import { concatBytes } from '../../../utils/buffer';
import { unpack } from '../../../utils/struct';
import type { Codec } from '../../codec';
import { serializable } from '../../common/types';
import { TypeSymbols } from '../../constants';
import type { WarpSignature } from './signature';
import { WarpUnsignedMessage } from './unsignedMessage';

@serializable()
export class WarpMessage {
  _type = TypeSymbols.WarpMessage;

  constructor(
    public readonly unsignedMessage: WarpUnsignedMessage,
    public readonly signature: WarpSignature,
  ) {}

  static fromBytes(bytes: Uint8Array, codec: Codec): [WarpMessage, Uint8Array] {
    const [unsignedMessage, signatureBytes] = unpack(
      bytes,
      [WarpUnsignedMessage],
      codec,
    );

    const [signature, rest] = codec.UnpackPrefix<WarpSignature>(signatureBytes);

    return [new WarpMessage(unsignedMessage, signature), rest];
  }

  toBytes(codec: Codec) {
    return concatBytes(
      this.unsignedMessage.toBytes(codec),
      codec.PackPrefix(this.signature),
    );
  }
}
