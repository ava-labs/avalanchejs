import { concatBytes } from '@noble/hashes/utils';
import { SubnetValidator } from '../vms/pvm/subnetValidator';
import { AddValidatorTx } from '../vms/pvm/addValidatorTx';
import { Validator } from '../vms/pvm/validator';
import {
  baseTx,
  baseTxbytes,
  transferableOutput,
  transferableOutputBytes,
} from './avax';
import { id, idBytes } from './common';
import { bigIntPr, bigIntPrBytes, int, intBytes } from './primitives';
import { outputOwner, outputOwnerBytes } from './secp256k1';
import { makeList, makeListBytes } from './utils/makeList';

export const validator = () =>
  new Validator(id(), bigIntPr(), bigIntPr(), bigIntPr());

export const validatorBytes = () =>
  concatBytes(idBytes(), bigIntPrBytes(), bigIntPrBytes(), bigIntPrBytes());

export const addValidatorTx = () =>
  new AddValidatorTx(
    baseTx(),
    validator(),
    makeList(transferableOutput)(),
    outputOwner(),
    int(),
  );
export const addValidatorTxBytes = () =>
  concatBytes(
    baseTxbytes(),
    validatorBytes(),
    makeListBytes(transferableOutputBytes)(),
    outputOwnerBytes(),
    intBytes(),
  );

export const subnetValidator = () => new SubnetValidator(validator(), id());

export const subnetValidatorBytes = () =>
  concatBytes(validatorBytes(), idBytes());
