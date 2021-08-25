import { Box, Static, Text, useApp } from 'ink'
import SelectInput from 'ink-select-input'
import React, { useEffect, useState } from 'react'
import { readTagsFromGit } from '../bisect/example'
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
  { label: 'rerun action', value: 'rerun' },
  { label: 'mark as good', value: 'good' },
  { label: 'mark as bad', value: 'bad' },
  { label: 'can not tell', value: 'skip' },
]
type Action = 'rerun' | Result

export interface InteractiveBisectProps {
  done: boolean
  onSelection?: (item: Item<Action>) => void
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
  const [checkResults, setCheckResults] = useState<CheckResult[]>([])
  const { exit } = useApp()

  const { done } = props
  useEffect(() => {
    if (done) {
      exit()
    }
  }, [done, exit])

  const onSelection = (item: Item<Action>) => {
    const result = item.value
    if (result !== 'rerun') {
      setCheckResults((cur) => [...cur, { result, version: props.toCheck?.version ?? 'should not happen' }])
    }
    props.onSelection?.(item)
  }

  return (
    <>
      <Static items={checkResults}>
        {(result) => (
          <Box key={result.version}>
            <Text color="green">{emojiFor(result) + ' ' + result.version}</Text>
          </Box>
        )}
      </Static>
      <Text>
        Check <Text color="yellow">{props.toCheck?.version ?? 'waiting'}</Text>
      </Text>

      <SelectInput items={items} onSelect={onSelection} />
    </>
  )
}

export class InteractiveScene implements Scene<Metadata> {
  constructor(private readonly handle: CommandLine) {}
  async suspects(): Promise<Suspect<Metadata>[]> {
    return readTagsFromGit()
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
  }

  async check(candidate: Suspect<Metadata>): Promise<Result> {
    return new Promise((resolve) => {
      const onSelection = (item: Item<Action>) => {
        const value = item.value
        if (value === 'rerun') {
          //todo
          return
        }
        resolve(value)
      }
      this.handle.rerender({ toCheck: candidate, onSelection })
    })
  }
}
