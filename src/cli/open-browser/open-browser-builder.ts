import open, { Options } from 'open'
import { Suspect } from '../../bisect/suspect'
import { UrlProvider } from '../checks'
import { Open } from './index'

interface OpenArguments {
  target: string
  options: Options
}

type OpenArgumentsProvider = (url: string) => OpenArguments
type Browser = 'microsoft edge' | 'google chrome'

// on mac the command to open command to open an icognito chrome/edge browser should look like this
//   open --new -a 'microsoft edge' https://example.org --args --inprivate
// for reasons I do not understand this opens the page in a none incognito instance, but also opens
// an incognito instance with an empty page
// thw workaround is to do something like this
//   open -a 'microsoft edge' --new --args --inprivate https://example.org
// also see https://github.com/sindresorhus/open/issues/41#issuecomment-735961969

export class OpenBrowserBuilder {
  private _incognito = false
  private _browser: Browser = 'microsoft edge'
  private _beta = false

  public incognito(value = true) {
    this._incognito = value
    return this
  }

  public beta(value = true) {
    this._beta = value
    return this
  }

  browser(name: Browser) {
    this._browser = name
    return this
  }

  open<T extends object>(urlProvider: UrlProvider<T>): Open<T> {
    const provider = (url: string) => {
      const cliArguments: string[] = []
      if (this._incognito) {
        cliArguments.push(incognitoFlagFor(this._browser))
        cliArguments.push(url)
      }
      const versionPostfix = this._beta ? ' beta' : ''
      const browserName = this._browser + versionPostfix
      const options: Options = {
        newInstance: true,
        app: { name: browserName, arguments: cliArguments },
      }
      const target = this._incognito ? '' : url
      return {
        target,
        options,
      }
    }
    return openInBrowser(urlProvider, provider)
  }
}

const incognitoFlagFor = (browser: Browser): string => {
  if (browser === 'microsoft edge') {
    return '--inprivate'
  }
  if (browser === 'google chrome') {
    return '--incognito'
  }
  return handleMissingCasesFor(browser)
}

const handleMissingCasesFor = (_arg: never): never => {
  throw new Error('should never happen')
}

const openInBrowser = <T extends object>(
  urlProvider: UrlProvider<T>,
  openArgumentsFor: OpenArgumentsProvider,
): Open<T> => {
  return async (suspect: Suspect<T>) => {
    const url = urlProvider(suspect)
    const { options, target } = openArgumentsFor(url)
    await open(target, options)
  }
}
