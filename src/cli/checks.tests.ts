import '@relmify/jest-fp-ts'
import { left, right } from 'fp-ts/Either'
import { serverRule } from './backend'
import { properlyDeployed } from './checks'

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
