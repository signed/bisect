import { bisect, Result, Scene, Suspect, Version } from './bisect'

export const bisectSuccess = async <T extends object>(knownGood: string, knownBad: string, scene: Scene<T>) => {
  const result = await bisect(knownGood, knownBad, scene)
  if (typeof result === 'string') {
    throw new Error('expected bisect to succeed')
  }
  return result
}

export const bisectFail = async <T extends object>(knownGood: Version, knownBad: Version, scene: Scene<T>) => {
  const result = await bisect(knownGood, knownBad, scene)
  if (typeof result !== 'string') {
    throw new Error('expected bisect to fail')
  }
  return result
}

export class RecordingScene implements Scene {
  public readonly checkedVersions: Version[] = []

  constructor(private readonly _suspects: Suspect[] = []) {}

  async suspects(): Promise<Suspect[]> {
    return this._suspects
  }

  async check(suspect: Suspect): Promise<Result> {
    const version = suspect.version
    if (version.includes('before')) {
      throw new Error('you should not check suspects before knowGood')
    }
    if (version.includes('after')) {
      throw new Error('you should not check suspects after known bad')
    }
    if (version === 'good') {
      throw new Error('you should not check known good')
    }
    if (version === 'bad') {
      throw new Error('you should not check known bad')
    }
    this.checkedVersions.push(version)
    if (version.includes('bad')) {
      return 'bad'
    }
    if (version.includes('good')) {
      return 'good'
    }
    throw new Error(`unexpected version ${version}`)
  }
}
