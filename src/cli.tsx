#!/usr/bin/env node
import { Instance, render, Text, useApp } from 'ink'
import SelectInput from 'ink-select-input'
import React, { useEffect } from 'react'
import { Result } from './bisect'

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
}

const App = (props: AppProps) => {
  const { done } = props
  const { exit } = useApp()

  useEffect(() => {
    if (done) {
      exit()
    }
  }, [done, exit])

  return (
    <>
      <Text>
        Check <Text color="yellow">17.34.117</Text>
      </Text>

      <SelectInput items={items} onSelect={props.onSelection} />
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
const selectionHandler = (item: Item<Action>) => {
  console.log(item.value)
  if (item.value === 'rerun') {
    handle.rerender({ done: true })
  }
}

handle.render({ done: false, onSelection: selectionHandler })
