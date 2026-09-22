import { customInspectSymbol } from '../../../constants/node';
import { base58check } from '../../../utils/base58';
import {
  hexToBuffer,
  padLeftStrict,
  requireBytes,
} from '../../../utils/buffer';
import { serializable } from '../../common/types';
import { Primitives } from '../../primitives/primatives';
import { TypeSymbols } from '../../constants';

export const NodeIDPrefix = 'NodeID-';

/**
 * Number of bytes per NodeId.
 */
export const SHORT_ID_LEN = 20;

@serializable()
export class NodeId extends Primitives {
  _type = TypeSymbols.NodeId;
  constructor(private readonly idVal: Uint8Array) {
    super();
  }

  static fromBytes(buf: Uint8Array): [NodeId, Uint8Array] {
    requireBytes(buf, SHORT_ID_LEN, 'NodeId');
    return [new NodeId(buf.slice(0, SHORT_ID_LEN)), buf.slice(SHORT_ID_LEN)];
  }

  [customInspectSymbol](_, options: any) {
    return options.stylize(this.toString(), 'string');
  }

  toBytes() {
    return padLeftStrict(this.idVal, SHORT_ID_LEN, 'NodeId');
  }

  toJSON() {
    return this.toString();
  }

  toString() {
    return NodeIDPrefix + base58check.encode(this.toBytes());
  }

  static fromString(str: string) {
    if (!str.includes(NodeIDPrefix)) {
      throw new Error('ID is missing prefix');
    }
    // Not routed through fromBytes: that decodes a wire buffer and requires a
    // full width NodeId, whereas a base58check string drops leading zero bytes.
    return new NodeId(
      padLeftStrict(
        base58check.decode(str.replace(NodeIDPrefix, '')),
        SHORT_ID_LEN,
        'NodeId',
      ),
    );
  }

  static fromHex(hex: string): NodeId {
    return new NodeId(hexToBuffer(hex));
  }

  value() {
    return this.toString();
  }
}
