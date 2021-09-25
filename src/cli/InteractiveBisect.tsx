import { Box, Static, Text, useApp } from 'ink'
import SelectInput from 'ink-select-input'
import React, { useEffect } from 'react'
import { Result, Scene } from '../bisect/scene'
import { Suspect } from '../bisect/suspect'
import { BisectContext, Metadata } from '../cli'
import { interactiveCheck } from './checks'
import { CommandLine } from './CommandLine'
import { Conclusion } from './conclusion'

export interface Item<V> {
  key?: string
  label: string
  value: V
}

const items: Item<Action>[] = [
  { label: 'mark as good', value: 'good' },
  { label: 'mark as bad', value: 'bad' },
  { label: 'can not tell', value: 'skip' },
]
type Action = Result

export interface InteractiveBisectProps {
  done: boolean
  conclusions: Conclusion[]
  onResult?: (item: Result) => void
  toCheck?: Suspect
}

const emojiFor = (conclusion: Conclusion): string => {
  switch (conclusion.result) {
    case 'good':
      return '✅'
    case 'bad':
      return '❌'
    case 'skip':
      return '💥'
  }
}

export const InteractiveBisect = (props: InteractiveBisectProps) => {
  const { exit } = useApp()

  const { done } = props
  useEffect(() => {
    if (done) {
      exit()
    }
  }, [done, exit])

  const onSelection = (item: Item<Action>) => {
    props.onResult?.(item.value)
  }

  return (
    <>
      <Static items={props.conclusions}>
        {(result) => (
          <Box key={result.version}>
            <Text color="green">{emojiFor(result) + ' ' + result.version}</Text>
          </Box>
        )}
      </Static>
      <Text>
        Check <Text color="yellow">{props.toCheck?.version ?? 'waiting'}</Text>
      </Text>

      {props.toCheck && props.onResult && <SelectInput items={items} onSelect={onSelection} />}
    </>
  )
}

export class InteractiveScene implements Scene<Metadata> {
  constructor(
    private readonly handle: CommandLine,
    private readonly suspect: () => Promise<Suspect<Metadata>[]>,
    private readonly context: BisectContext,
  ) {}

  async suspects(): Promise<Suspect<Metadata>[]> {
    return this.suspect()
  }

  async check(candidate: Suspect<Metadata>): Promise<Result> {
    const flup = interactiveCheck(this.context, this.handle)(candidate)
    return flup.then((checkResult) => {
      if (checkResult === 'passed') {
        throw new Error(`could not come to a conclusion about ${candidate.version}`)
      }
      return checkResult
    })
  }
}
