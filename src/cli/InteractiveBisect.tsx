import { Box, Static, Text, useApp } from 'ink'
import SelectInput from 'ink-select-input'
import React, { useEffect } from 'react'
import { Result, Scene } from '../bisect/scene'
import { Suspect } from '../bisect/suspect'
import { Version } from '../bisect/version'
import { Metadata } from '../cli'
import { BisectContext, OnResult } from './BisectContext'
import { Check } from './checks'
import { Conclusion } from './conclusion'

interface Item<V> {
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
  onResult?: OnResult
  toCheck?: Version
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
      {!done && (
        <Text>
          Check <Text color="yellow">{props.toCheck ?? 'waiting'}</Text>
        </Text>
      )}

      {props.toCheck && props.onResult && <SelectInput items={items} onSelect={onSelection} />}
    </>
  )
}

export class InteractiveScene implements Scene<Metadata> {
  constructor(
    private readonly context: BisectContext,
    private readonly suspect: () => Promise<Suspect<Metadata>[]>,
    private readonly _check: Check<Metadata>,
  ) {}

  async suspects(): Promise<Suspect<Metadata>[]> {
    return this.suspect()
  }

  async check(suspect: Suspect<Metadata>): Promise<Result> {
    this.context.check(suspect.version)
    const flup = this._check(suspect)
    return flup.then((checkResult) => {
      if (checkResult === 'passed') {
        throw new Error(`could not come to a conclusion about ${suspect.version}`)
      }
      this.context.conclude(suspect.version, checkResult)
      return checkResult
    })
  }
}
