/**
 * @packageDocumentation
 * @module Keystore-Interfaces
 */

import { CredsInterface } from "../../common"

export interface ImportUserParams extends CredsInterface {
  user: string
}
