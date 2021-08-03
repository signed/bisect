#!/usr/bin/env node
import { Instance, render, Text, useApp, Static, Box } from 'ink'
import SelectInput from 'ink-select-input'
import React, { useEffect, useState } from 'react'
import { bisect, Result, Scene, Suspect, Version } from './bisect'
import { Metadata, readTagsFromGit } from './example'

export interface Item<V> {
  key?: string
  label: string
  value: V
}

const items: Item<Action>[] = [
  { label: 'rerun action', value: 'rerun' },
  { label: 'mark as good', value: 'good' },
  { label: 'mark as bad', value: 'bad' },
]

type Action = 'rerun' | Result

interface AppProps {
  onSelection: (item: Item<Action>) => void
  done: boolean
  toCheck?: Suspect
}

interface CheckResult {
  version: Version
  result: Result
}

const App = (props: AppProps) => {
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
    props.onSelection(item)
  }

  return (
    <>
      <Static items={checkResults}>
        {(test) => (
          <Box key={test.version}>
            <Text color="green">{(test.result === 'good' ? '✅' : '❌') + ' ' + test.version}</Text>
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

class ApplicationHandle {
  private instance: Instance | undefined
  private appProps: AppProps | undefined

  constructor() {}

  render(appProps: AppProps) {
    this.appProps = { ...appProps }
    const theApp = <App {...this.appProps} />
    this.instance = render(theApp)
  }

  rerender(appProps: Partial<AppProps> = {}) {
    this.appProps = { ...(this.appProps as AppProps), ...appProps }
    if (this.instance) {
      const theApp = <App {...this.appProps} />
      this.instance.rerender(theApp)
    }
  }
}

const handle = new ApplicationHandle()
const selectionHandler = (_item: Item<Action>) => {
  //do nothing
}

export class ExampleScene2 implements Scene<Metadata> {
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
      handle.rerender({ toCheck: candidate, onSelection })
    })
  }
}

bisect('19.38.85', '19.38.129', new ExampleScene2()).then((result) => {
  console.log(JSON.stringify(result, null, 2))
})

handle.render({ done: false, onSelection: selectionHandler })
