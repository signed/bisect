import { Version } from './version'

export type Suspect<T extends object = {}> = { version: Version } & T
