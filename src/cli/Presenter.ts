import { Result } from '../bisect/scene'
import { Version } from '../bisect/version'
import { BisectContext, OnResult } from './BisectContext'
import { CommandLine } from './CommandLine'
import { Conclusion } from './conclusion'

export class Presenter implements BisectContext {
  private readonly conclusions: Conclusion[] = []

  constructor(private readonly cli: CommandLine) {}

  check(toCheck: Version, onResult: OnResult): void {
    this.cli.rerender({ toCheck, onResult })
  }

  conclude(version: Version, result: Result): void {
    const conclusion = { result, version }
    this.conclusions.push(conclusion)
    this.cli.rerender({ toCheck: undefined, conclusions: [...this.conclusions] })
  }
}