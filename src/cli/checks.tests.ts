import '@relmify/jest-fp-ts'
import { left, right } from 'fp-ts/Either'
import { serverRule } from './backend'
import { properlyDeployed } from './checks'

export const { deploy } = serverRule()

test('pass deploy check if deployed version matches suspect', async () => {
  deploy('matching-version', 'http://localhost')
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
  const newVar = await check({ version: 'matching-version' })
  expect(newVar).toEqual('passed')
})

test('skip deploy check if deployed version does not match suspect', async () => {
  deploy('deployed-version', 'http://localhost')
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
  const newVar = await check({ version: 'different-version' })
  expect(newVar).toEqual('skip')
})
