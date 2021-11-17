import { Suspect } from '../../bisect/suspect'
import { OpenBrowserBuilder } from './open-browser-builder'

export type Open<T extends object> = (suspect: Suspect<T>) => void

export const inEdge = () => new OpenBrowserBuilder().browser('microsoft edge')
export const inChrome = () => new OpenBrowserBuilder().browser('google chrome')
