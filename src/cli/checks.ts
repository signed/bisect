import { Either, isLeft } from 'fp-ts/Either'
import needle from 'needle'
import { Result } from '../bisect/scene'
import { Suspect } from '../bisect/suspect'
import { Version } from '../bisect/version'

export type VersionExtractor = (html: string) => Either<string, Version>
export type UrlProvider<T extends object> = (suspect: Readonly<Suspect<T>>) => string
export type CheckResult = 'passed' | Result
export type Check<T extends object> = (suspect: Readonly<Suspect<T>>) => Promise<CheckResult>

export const properlyDeployed = <T extends object>(urlFor: UrlProvider<T>, extractVersionFrom: VersionExtractor) => {
  const bound: Check<T> = async (suspect) => {
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
  }
  return bound
}
