import { Either, isLeft } from 'fp-ts/Either'
import needle from 'needle'
import { Result } from '../bisect/scene'
import { Suspect } from '../bisect/suspect'
import { Version } from '../bisect/version'
import { BisectContext } from './BisectContext'
import { Open } from './opens'

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

export const interactiveCheck = <T extends object>(context: BisectContext, open: Open<T> = () => {}): Check<T> => {
  return async (suspect) => {
    return new Promise(async (resolve) => {
      const onResult = (result: Result) => {
        context.clearOnResult()
        resolve(result)
      }
      context.addOnResult(onResult)
      await open(suspect)
    })
  }
}

export const inSequence = <T extends object>(...checks: Check<T>[]): Check<T> => {
  return (suspect: Suspect<T>) => {
    const inOrder = async (): Promise<CheckResult> => {
      for (const check of checks) {
        const outcome = await check(suspect)
        if (outcome !== 'passed') {
          return outcome
        }
      }
      throw new Error(`could not come to a conclusion about ${suspect.version}`)
    }
    return inOrder()
  }
}
