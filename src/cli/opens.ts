import open from 'open'
import { Suspect } from '../bisect/suspect'
import { UrlProvider } from './checks'

export type Open<T extends object> = (suspect: Suspect<T>) => void

export const openInBrowser = <T extends object>(urlProvider: UrlProvider<T>): Open<T> => {
  return async (suspect: Suspect<T>) => {
    const url = urlProvider(suspect)
    await open(url, { app: { name: 'google chrome', arguments: ['--incognito'] } })
  }
}
