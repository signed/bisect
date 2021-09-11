import { Version } from './version'

export type Suspect<T extends object = {}> = Readonly<{ version: Version } & T>
