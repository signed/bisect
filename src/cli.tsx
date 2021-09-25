#!/usr/bin/env node
import { bisect } from './bisect/bisect'
import { readTagsFromGit } from './bisect/example'
import { Result } from './bisect/scene'
import { Suspect } from './bisect/suspect'
import { Version } from './bisect/version'
import { CommandLine } from './cli/CommandLine'
import { Conclusion } from './cli/conclusion'
import { InteractiveScene } from './cli/InteractiveBisect'

export type Metadata = {
  date: string
  hash: string
}

const suspects = async () =>
  readTagsFromGit()
    .trim()
    .split('\n')
    .reverse()
    .map((line): Suspect<Metadata> => {
      const parts = line.split(' ')
      const [date, tag, hash] = parts
      if (date === undefined || tag === undefined || hash === undefined) {
        throw new Error('should not happen')
      }
      const start = tag.lastIndexOf('@')
      const version = tag.substring(start + 1)
      return {
        version,
        hash,
        date,
      }
    })

export type OnResult = (result: Result) => void

export interface BisectContext {
  check(toCheck: Version, onResult: OnResult): void

  conclude(version: Version, result: Result): void
}

class Presenter implements BisectContext {
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

const cli = new CommandLine()
const presenter = new Presenter(cli)
const scene = new InteractiveScene(suspects, presenter)

bisect('19.38.85', '19.38.129', scene).then((result) => {
  console.log(JSON.stringify(result, null, 2))
  cli.rerender({ done: true })
})
cli.render({ done: false, conclusions: [] })
