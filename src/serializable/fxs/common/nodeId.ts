import { customInspectSymbol } from '../../../constants/node';
import { base58check, decodeBase58Check } from '../../../utils/base58';
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
    return [new NodeId(buf.slice(0, SHORT_ID_LEN)), buf.subarray(SHORT_ID_LEN)];
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
    // Bounded and exact, for the same reasons as Id.fromString: a NodeID that
    // decodes to the wrong width must be rejected, not silently reshaped into
    // a different node's ID and staked under. No padding — base58 preserves
    // leading zero bytes, so a genuine NodeID always decodes to 20 bytes.
    return new NodeId(
      decodeBase58Check(str.replace(NodeIDPrefix, ''), SHORT_ID_LEN),
    );
  }

  static fromHex(hex: string): NodeId {
    return new NodeId(hexToBuffer(hex));
  }

  value() {
    return this.toString();
  }
}
