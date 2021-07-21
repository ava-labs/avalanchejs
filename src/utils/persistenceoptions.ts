/**
 * @packageDocumentation
 * @module Utils-PersistanceOptions
 */

import { MergeRule } from "./constants"
/**
 * A class for defining the persistance behavior of this an API call.
 *
 */
export class PersistanceOptions {
  protected name: string = undefined

  protected overwrite: boolean = false

  protected mergeRule: MergeRule = "union"

  /**
   * Returns the namespace of the instance
   */
  getName = (): string => this.name

  /**
   * Returns the overwrite rule of the instance
   */
  getOverwrite = (): boolean => this.overwrite

  /**
   * Returns the [[MergeRule]] of the instance
   */
  getMergeRule = (): MergeRule => this.mergeRule

  /**
   *
   * @param name The namespace of the database the data
   * @param overwrite True if the data should be completey overwritten
   * @param MergeRule The type of process used to merge with existing data: "intersection", "differenceSelf", "differenceNew", "symDifference", "union", "unionMinusNew", "unionMinusSelf"
   *
   * @remarks
   * The merge rules are as follows:
   *   * "intersection" - the intersection of the set
   *   * "differenceSelf" - the difference between the existing data and new set
   *   * "differenceNew" - the difference between the new data and the existing set
   *   * "symDifference" - the union of the differences between both sets of data
   *   * "union" - the unique set of all elements contained in both sets
   *   * "unionMinusNew" - the unique set of all elements contained in both sets, excluding values only found in the new set
   *   * "unionMinusSelf" - the unique set of all elements contained in both sets, excluding values only found in the existing set
   */
  constructor(name: string, overwrite: boolean = false, mergeRule: MergeRule) {
    this.name = name
    this.overwrite = overwrite
    this.mergeRule = mergeRule
  }
}
