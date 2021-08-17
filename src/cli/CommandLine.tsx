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
    this.appProps = { ...(this.appProps as InteractiveBisectProps), ...appProps }
    if (!this.instance) {
      throw new Error('You have to call render first')
    }
    const theApp = <InteractiveBisect {...this.appProps} />
    this.instance.rerender(theApp)
  }
}
