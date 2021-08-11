import { Split, split } from './arrays'
import { Either, Left, Right } from 'purify-ts'

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

type ValidatedInput<T extends object> = {
  lastGood: Suspect<T>
  firstBad: Suspect<T>
  candidates: Suspect<T>[]
}
type ValidationResult<T extends object> = Either<BisectError, ValidatedInput<T>>

const validateInput = <T extends object>(
  knownGood: Version,
  knownBad: Version,
  suspects: Suspect<T>[],
): ValidationResult<T> => {
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
    return Left('good version not in suspects')
  }
  if (end === -1) {
    return Left('bad version not in suspects')
  }
  if (end < start) {
    return Left('bad version before good version')
  }
  let lastGood = suspects[start] as Suspect<T>
  let firstBad = suspects[end] as Suspect<T>
  const candidates = suspects.splice(start + 1, end - 1)

  return Right({
    lastGood,
    firstBad,
    candidates,
  })
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
  const validadtionResult = validateInput(knownGood, knownBad, suspects)

  if (validadtionResult.isLeft()) {
    return validadtionResult.extract()
  }

  if (validadtionResult.isRight()) {
    const validatedInput = validadtionResult.extract()
    let lastGood = validatedInput.lastGood
    let firstBad = validatedInput.firstBad
    const candidates = validatedInput.candidates

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

  throw new Error('should never happen')
}
