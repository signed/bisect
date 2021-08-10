import { Split, split } from './arrays'

export type Version = string
export type Suspect<T extends object = {}> = { version: Version } & T

export type Result = 'good' | 'bad' | 'skip'
export type Check<T extends object = {}> = (candidate: Suspect<T>) => Promise<Result>

export interface Scene<T extends object = {}> {
  suspects: () => Promise<Suspect<T>[]>
  check: Check<T>
}

type BisectError =
  | 'knownGood and knowBad are the same'
  | 'good version not in suspects'
  | 'bad version not in suspects'
  | 'bad version before good version'

type BisectOutcome<T extends object = {}> = { lastGood: Suspect<T>; firstBad: Suspect<T> }
type BisectResult<T extends object = {}> = BisectOutcome<T> | BisectError

const remainingSuspectsFrom = <T>(parts: Split<T>, result: 'good' | 'bad' | 'skip') => {
  if (result === 'skip') {
    return [...parts.left, ...parts.right]
  }
  return result === 'bad' ? parts.left : parts.right
}
export const bisect = async <T extends object>(
  knownGood: Version,
  knownBad: Version,
  scene: Scene<T>,
): Promise<BisectResult> => {
  if (knownGood === knownBad) {
    return 'knownGood and knowBad are the same'
  }
  const suspects = await scene.suspects()
  const { start, end } = suspects.reduce(
    (acc, cur, index) => {
      if (cur.version === knownGood) {
        acc.start = index
      }
      if (cur.version === knownBad) {
        acc.end = index
      }
      return acc
    },
    { start: -1, end: -1 },
  )
  if (start === -1) {
    return 'good version not in suspects'
  }
  if (end === -1) {
    return 'bad version not in suspects'
  }
  if (end < start) {
    return 'bad version before good version'
  }
  let lastGood = suspects[start] as Suspect<T>
  let firstBad = suspects[end] as Suspect<T>
  const candidates = suspects.splice(start + 1, end - 1)
  let parts = split(candidates)

  while (parts.center) {
    const result = await scene.check(parts.center)
    if (result === 'bad') {
      firstBad = parts.center
    }
    if (result === 'good') {
      lastGood = parts.center
    }
    parts = split(remainingSuspectsFrom(parts, result))
  }

  return { lastGood, firstBad }
}
