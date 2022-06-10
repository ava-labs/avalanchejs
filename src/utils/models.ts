import { OutputOwner } from '../transactions/outputOwner';

export type UnpackReturn =
  | Uint8Array
  | number
  | bigint
  | string
  | string[]
  | OutputOwner;
