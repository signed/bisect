import { Result } from '../bisect/scene'
import { Version } from '../bisect/version'

export type OnResult = (result: Result) => void

export interface BisectContext {
  check(toCheck: Version, onResult: OnResult): void

  conclude(version: Version, result: Result): void
}
