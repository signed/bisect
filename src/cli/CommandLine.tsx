import React from 'react'
import { Instance, render } from 'ink'
import { InteractiveBisectProps, InteractiveBisect } from './InteractiveBisect'

export class CommandLine {
  private instance: Instance | undefined
  private appProps: InteractiveBisectProps | undefined

  render(appProps: InteractiveBisectProps) {
    this.appProps = { ...appProps }
    const theApp = <InteractiveBisect {...this.appProps} />
    this.instance = render(theApp)
  }

  rerender(appProps: Partial<InteractiveBisectProps> = {}) {
    if (this.appProps === undefined || this.instance === undefined) {
      throw new Error('You have to call render first')
    }
    this.appProps = { ...this.appProps, ...appProps }
    const theApp = <InteractiveBisect {...this.appProps} />
    this.instance.rerender(theApp)
  }
}
