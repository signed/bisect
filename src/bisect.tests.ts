import type { Version } from './bisect'
import { bisectFail, bisectSuccess, RecordingScene } from './bisect.fixture'

test('fail if good version is not in suspects', async () => {
  expect(await bisectFail('good', 'does not matter', suspects())).toBe('good version not in suspects')
})

test('fail if bad version is not in suspects', async () => {
  expect(await bisectFail('good', 'bad', suspects('good'))).toBe('bad version not in suspects')
})

test('suspects have be in order knowGood has to come before knownBad', async () => {
  expect(await bisectFail('good', 'bad', suspects('bad', 'good'))).toBe('bad version before good version')
})

test('knowGood and knownBad can not be the same', async () => {
  expect(await bisectFail('same', 'same', suspects())).toEqual('knownGood and knowBad are the same')
})

test('return knownBad if there is no bad version in between', async () => {
  const result = await bisectSuccess('good', 'bad', suspects('good', 'bad'))
  expect(result.lastGood.version).toBe('good')
  expect(result.firstBad.version).toBe('bad')
})

test('only check versions between knownGood and knownBad', async () => {
  const result = await bisectSuccess('good', 'bad', suspects('before good', 'good', '1st bad', 'bad', 'after bad'))
  expect(result.lastGood.version).toBe('good')
  expect(result.firstBad.version).toBe('1st bad')
})

test('return the first bad version between knownGood and knowBad and', async () => {
  const result = await bisectSuccess('good', 'bad', suspects('good', '1st bad', 'bad'))
  expect(result.lastGood.version).toBe('good')
  expect(result.firstBad.version).toBe('1st bad')
})

test('test the center suspect instead of ever single one', async () => {
  const scene = suspects('good', '2nd good', 'center good', '1st bad', 'bad')
  const result = await bisectSuccess('good', 'bad', scene)
  expect(result.firstBad.version).toBe('1st bad')
  expect(result.lastGood.version).toBe('center good')
  expect(scene.checkedVersions).toEqual(['center good', '1st bad'])
})

const suspects = (...versions: Version[]) => {
  const suspects = versions.map((version) => ({ version }))
  return new RecordingScene(suspects)
}
