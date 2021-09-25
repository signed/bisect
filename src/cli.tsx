#!/usr/bin/env node
import { bisect } from './bisect/bisect'
import { readTagsFromGit } from './bisect/example'
import { Suspect } from './bisect/suspect'
import { CommandLine } from './cli/CommandLine'
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

const cli = new CommandLine()
const scene = new InteractiveScene(cli, suspects)

bisect('19.38.85', '19.38.129', scene).then((result) => {
  console.log(JSON.stringify(result, null, 2))
  cli.rerender({ done: true })
})
cli.render({ done: false, conclusions: [] })
