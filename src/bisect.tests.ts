import type { Result, Scene, Suspect, Version } from './bisect'
import { bisect } from './bisect'

test('fail if good version is not in suspects', () => {
  expect(bisect('good', 'does not matter', suspects())).toBe('good version not in suspects')
})

test('fail if bad version is not in suspects', () => {
  expect(bisect('good', 'bad', suspects('good'))).toBe('bad version not in suspects')
})

test('suspects have be in order knowGood has to come before knownBad', () => {
  expect(bisect('good', 'bad', suspects('bad', 'good'))).toBe('bad version before good version')
})

test('knowGood and knownBad can not be the same', () => {
  expect(bisect('same', 'same', suspects())).toEqual('knownGood and knowBad are the same')
})

test('return knownBad if there is no bad version in between', () => {
  expect(bisect('good', 'bad', suspects('good', 'bad'))).toBe('bad')
})

test('return test suspects between knownGood and knowBad and return the first bad version', () => {
  expect(bisect('good', 'bad', suspects('good', '1st bad', 'bad'))).toBe('1st bad')
})

test('only check versions between knownGood and knownBad', () => {
  expect(bisect('good', 'bad', suspects('before good', 'good', '1st bad', 'bad', 'after bad'))).toBe('1st bad')
})

test('test the center suspect instead of ever single one', () => {
  const scene = suspects('good', '2nd good', 'center good', '1st bad', 'bad')
  expect(bisect('good', 'bad', scene)).toBe('1st bad')
  expect(scene.checkedVersions).toEqual(['center good', '1st bad'])
})

const suspects = (...versions: Version[]) => {
  const suspects = versions.map((version) => ({ version }))
  return new RecordingScene(suspects)
}

class RecordingScene implements Scene {
  public readonly checkedVersions: Version[] = []

  constructor(private readonly _suspects: Suspect[] = []) {}

  suspects(): Suspect<{}>[] {
    return this._suspects
  }

  check(suspect: Suspect<{}>): Result {
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
