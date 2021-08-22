import { Suspect } from './suspect'

export interface Scene<T extends object = {}> {
  suspects: () => Promise<Suspect<T>[]>
  check: (candidate: Suspect<T>) => Promise<Result>
}

export type Result = 'good' | 'bad' | 'skip'
