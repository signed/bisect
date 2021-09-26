import { bisectSuccess } from '../bisect/bisect.fixture'
import { ExampleScene } from './example'

test('solve production example', async () => {
  const scene = new ExampleScene()
  const result = await bisectSuccess('19.38.85', '19.38.129', scene)
  expect(result.firstBad.version).toEqual('19.38.115')
  expect(result.lastGood.version).toEqual('19.38.114')
  expect(scene.checkedVersions).toStrictEqual([
    '19.38.107',
    '19.38.118',
    '19.38.112',
    '19.38.115',
    '19.38.113',
    '19.38.114',
  ])
})
