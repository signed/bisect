#!/usr/bin/env node
import { bisect } from './bisect/bisect'
import { suspects } from './bisect/example'
import { inSequence, interactiveCheck } from './cli/checks'
import { CommandLine } from './cli/CommandLine'
import { InteractiveScene } from './cli/InteractiveBisect'
import { Presenter } from './cli/Presenter'

export type Metadata = {
  date: string
  hash: string
}

const cli = new CommandLine()
const presenter = new Presenter(cli)

const check = interactiveCheck(presenter)
const scene = new InteractiveScene(presenter, suspects, inSequence(check))

bisect('19.38.85', '19.38.129', scene).then((result) => {
  console.log(JSON.stringify(result, null, 2))
  cli.rerender({ done: true })
})
cli.render({ done: false, conclusions: [] })
