import { Result } from '../bisect/scene'
import { Version } from '../bisect/version'

export interface Conclusion {
  version: Version
  result: Result
}
