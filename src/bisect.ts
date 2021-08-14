import { chain, Either, isLeft, left, map, right } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
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

type ValidatedInput<T extends object> = {
  lastGood: Suspect<T>
  firstBad: Suspect<T>
  candidates: Suspect<T>[]
}
type ValidationResult<T extends object> = Either<BisectError, ValidatedInput<T>>

type StartEnd = { start: number; end: number }
const includesGoodVersion = (se: StartEnd): Either<BisectError, StartEnd> => {
  if (se.start === -1) {
    return left('good version not in suspects')
  }
  return right(se)
}

const includesBadVersion = (se: StartEnd): Either<BisectError, StartEnd> => {
  if (se.end === -1) {
    return left('bad version not in suspects')
  }
  return right(se)
}

const goodBeforeBadVersion = (se: StartEnd): Either<BisectError, StartEnd> => {
  if (se.end < se.start) {
    return left('bad version before good version')
  }
  return right(se)
}

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
  const createValidatedResult = ({ start, end }: StartEnd) => {
    const lastGood = suspects[start] as Suspect<T>
    const firstBad = suspects[end] as Suspect<T>
    const candidates = suspects.splice(start + 1, end - 1)
    return {
      lastGood,
      firstBad,
      candidates,
    }
  }
  return pipe(
    includesGoodVersion({ start, end }),
    chain(includesBadVersion),
    chain(goodBeforeBadVersion),
    map(createValidatedResult),
  )
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

  if (isLeft(validadtionResult)) {
    return validadtionResult.left
  }

  const validatedInput = validadtionResult.right
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
