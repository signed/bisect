import '@relmify/jest-fp-ts'
import { left, right } from 'fp-ts/Either'
import { serverRule } from './backend'
import { Check, inSequence, properlyDeployed } from './checks'

export const { deploy, connectionProblems } = serverRule()

test('pass deploy check if deployed version matches suspect', async () => {
  deploy('matching-version', 'http://localhost')

  expect(await check({ version: 'matching-version' })).toEqual('passed')
})

test('skip if deployed version does not match suspect', async () => {
  deploy('deployed-version', 'http://localhost')

  expect(await check({ version: 'different-version' })).toEqual('skip')
})

test('skip if connection fails', async () => {
  connectionProblems()

  expect(await check({ version: 'different-version' })).toEqual('skip')
})

const check = properlyDeployed(
  () => 'http://localhost',
  (html) => {
    const version = html.split(':')[1]
    if (version === undefined) {
      return left('this is unexpected')
    }
    return right(version)
  },
)

test('empty check fails', () => {
  const check = inSequence()
  const version = '1'
  return expect(check(suspectWithVersion(version))).rejects.toThrow('could not come to a conclusion about 1')
})

test('return result from the first check that returns one', () => {
  const skip: Check<{}> = async () => 'skip'
  const check = inSequence<{}>(skip)
  return expect(check(anySuspect())).resolves.toBe('skip')
})

test('continue with next check on a check returning passed', () => {
  const good: Check<{}> = async () => 'good'
  const passed: Check<{}> = async () => 'passed'
  const check = inSequence<{}>(passed, good)
  return expect(check(anySuspect())).resolves.toBe('good')
})

const anySuspect = () => suspectWithVersion('42')
const suspectWithVersion = (version: string) => ({ version: version })
