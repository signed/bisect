import { Either, isLeft } from 'fp-ts/Either'
import needle from 'needle'
import { Result } from '../bisect/scene'
import { Suspect } from '../bisect/suspect'
import { Version } from '../bisect/version'
import { BisectContext } from './BisectContext'

export type VersionExtractor = (html: string) => Either<string, Version>
export type UrlProvider<T extends object> = (suspect: Suspect<T>) => string
export type CheckResult = 'passed' | Result
export type Check<T extends object> = (suspect: Suspect<T>) => Promise<CheckResult>

export const properlyDeployed = <T extends object>(urlFor: UrlProvider<T>, extractVersionFrom: VersionExtractor) => {
  const bound: Check<T> = async (suspect) => {
    try {
      const url = urlFor(suspect)
      const { version } = suspect
      const response = await needle('get', url)
      const page = response.raw.toString()
      const versionFromPage = extractVersionFrom(page)
      if (isLeft(versionFromPage)) {
        return 'skip'
      }
      const failedDeployment = versionFromPage.right !== version
      if (failedDeployment) {
        return 'skip'
      }
      return 'passed'
    } catch (_) {
      return 'skip'
    }
  }
  return bound
}

export type Open<T extends object> = (suspect: Suspect<T>) => void

export const interactiveCheck = <T extends object>(suspect: BisectContext, open: Open<T> = () => {}): Check<T> => {
  const bound: Check<T> = async (candidate: Suspect<T>) => {
    return new Promise(async (resolve) => {
      const onSelection = (result: Result) => {
        suspect.conclude(candidate.version, result)
        resolve(result)
      }
      await open(candidate)
      suspect.check(candidate.version, onSelection)
    })
  }
  return bound
}
