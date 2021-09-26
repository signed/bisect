import { Result } from '../bisect/scene'
import { Version } from '../bisect/version'

export type OnResult = (result: Result) => void

export interface BisectContext {
  initialize(): void

  check(toCheck: Version): void

  addOnResult(listener: OnResult): void
  clearOnResult(): void

  conclude(version: Version, result: Result): void
}
