import { chain, Either, isLeft, left, map, right } from 'fp-ts/Either'
import { flow } from 'fp-ts/function'
import { Split, split } from './arrays'
import { Scene } from './scene'
import { Suspect } from './suspect'
import { Version } from './version'

type BisectOutcome<T extends object = {}> = BisectResult<T> | BisectError
type BisectResult<T extends object = {}> = { lastGood: Suspect<T>; firstBad: Suspect<T> }
type BisectError =
  | 'knownGood and knowBad are the same'
  | 'good version not in suspects'
  | 'bad version not in suspects'
  | 'bad version before good version'

export const bisect = async <T extends object>(
  knownGood: Version,
  knownBad: Version,
  scene: Scene<T>,
): Promise<BisectOutcome> => {
  const validadtionResult = validateInput(knownGood, knownBad, await scene.suspects())
  if (isLeft(validadtionResult)) {
    return validadtionResult.left
  }
  let { candidates, firstBad, lastGood } = validadtionResult.right
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

const validateInput = <T extends object>(
  knownGood: Version,
  knownBad: Version,
  suspects: Suspect<T>[],
): ValidationResult<T> => {
  const startEnd = suspects.reduce(
    (acc, cur, index) => {
      if (cur.version === knownGood) {
        acc.start = index
      }
      if (cur.version === knownBad) {
        acc.end = index
      }
      return acc
    },
    { start: -1, end: -1, knownGood, knownBad },
  )
  const createValidatedResult = ({ start, end }: ValidationInput) => {
    const lastGood = suspects[start] as Suspect<T>
    const firstBad = suspects[end] as Suspect<T>
    const candidates = suspects.slice(start + 1, end)
    return {
      lastGood,
      firstBad,
      candidates,
    }
  }
  return flow(
    knowGoodAndKnowBadAreDifferent,
    chain(includesGoodVersion),
    chain(includesBadVersion),
    chain(goodBeforeBadVersion),
    map(createValidatedResult),
  )(startEnd)
}

type ValidatedInput<T extends object> = {
  lastGood: Suspect<T>
  firstBad: Suspect<T>
  candidates: Suspect<T>[]
}
type ValidationInput = { start: number; end: number; knownGood: Version; knownBad: Version }
type ValidationResult<T extends object> = Either<BisectError, ValidatedInput<T>>

const knowGoodAndKnowBadAreDifferent = (se: ValidationInput): Either<BisectError, ValidationInput> => {
  if (se.knownGood === se.knownBad) {
    return left('knownGood and knowBad are the same')
  }
  return right(se)
}

const includesGoodVersion = (se: ValidationInput): Either<BisectError, ValidationInput> => {
  if (se.start === -1) {
    return left('good version not in suspects')
  }
  return right(se)
}

const includesBadVersion = (se: ValidationInput): Either<BisectError, ValidationInput> => {
  if (se.end === -1) {
    return left('bad version not in suspects')
  }
  return right(se)
}

const goodBeforeBadVersion = (se: ValidationInput): Either<BisectError, ValidationInput> => {
  if (se.end < se.start) {
    return left('bad version before good version')
  }
  return right(se)
}

const remainingSuspectsFrom = <T>(parts: Split<T>, result: 'good' | 'bad' | 'skip') => {
  if (result === 'skip') {
    return [...parts.left, ...parts.right]
  }
  return result === 'bad' ? parts.left : parts.right
}
