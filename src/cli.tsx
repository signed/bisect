#!/usr/bin/env node
import { bisect } from './bisect/bisect'
import { CommandLine } from './cli/CommandLine'
import { InteractiveScene } from './cli/InteractiveBisect'

export type Metadata = {
  date: string
  hash: string
}

const cli = new CommandLine()
const scene = new InteractiveScene(cli)

bisect('19.38.85', '19.38.129', scene).then((result) => {
  console.log(JSON.stringify(result, null, 2))
  cli.render({ done: true })
})
cli.render({ done: false })
