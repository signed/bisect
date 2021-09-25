import { Box, Static, Text, useApp } from 'ink'
import SelectInput from 'ink-select-input'
import React, { useEffect } from 'react'
import { Result, Scene } from '../bisect/scene'
import { Suspect } from '../bisect/suspect'
import { Version } from '../bisect/version'
import { Metadata } from '../cli'
import { CommandLine } from './CommandLine'

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
export type Action = Result

export interface InteractiveBisectProps {
  done: boolean
  results: CheckResult[]
  onResult?: (item: Result) => void
  toCheck?: Suspect
}

interface CheckResult {
  version: Version
  result: Result
}

const emojiFor = (result: CheckResult): string => {
  switch (result.result) {
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
      <Static items={props.results}>
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
  private readonly checkResults: CheckResult[] = []

  constructor(private readonly handle: CommandLine, private readonly suspect: () => Promise<Suspect<Metadata>[]>) {}

  async suspects(): Promise<Suspect<Metadata>[]> {
    return this.suspect()
  }

  async check(candidate: Suspect<Metadata>): Promise<Result> {
    return new Promise((resolve) => {
      const onSelection = (result: Result) => {
        this.checkResults.push({ result, version: candidate.version })
        resolve(result)
        this.handle.rerender({ toCheck: undefined, results: [...this.checkResults] })
      }
      this.handle.rerender({ toCheck: candidate, onResult: onSelection })
    })
  }
}
