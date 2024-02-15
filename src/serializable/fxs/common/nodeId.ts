import { customInspectSymbol } from '../../../constants/node';
import { base58check } from '../../../utils/base58';
import { hexToBuffer, padLeft } from '../../../utils/buffer';
import { serializable } from '../../common/types';
import { Primitives } from '../../primitives/primatives';
import { TypeSymbols } from '../../constants';

export const NodeIDPrefix = 'NodeID-';
@serializable()
export class NodeId extends Primitives {
  _type = TypeSymbols.NodeId;
  constructor(private readonly idVal: Uint8Array) {
    super();
  }

  static fromBytes(buf: Uint8Array): [NodeId, Uint8Array] {
    return [new NodeId(buf.slice(0, 20)), buf.slice(20)];
  }

  [customInspectSymbol](_, options: any) {
    return options.stylize(this.toString(), 'string');
  }

  toBytes() {
    return padLeft(this.idVal, 20);
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
    return this.fromBytes(base58check.decode(str.replace(NodeIDPrefix, '')))[0];
  }

  static fromHex(hex: string): NodeId {
    return new NodeId(hexToBuffer(hex));
  }

  value() {
    return this.toString();
  }
}
