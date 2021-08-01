import { Result, Scene, Suspect, Version } from './bisect'
import { bisectSuccess } from './bisect.fixture'

test('solve production example', () => {
  const scene = new ExampleScene()
  const result = bisectSuccess('19.38.85', '19.38.129', scene)
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

class ExampleScene implements Scene<Metadata> {
  readonly checkedVersions: Version[] = []
  suspects(): Suspect<Metadata>[] {
    return readTagsFromGit()
      .trim()
      .split('\n')
      .reverse()
      .map((line): Suspect<Metadata> => {
        const parts = line.split(' ')
        const [date, tag, hash] = parts
        if (date === undefined || tag === undefined || hash === undefined) {
          throw new Error('should not happen')
        }
        const start = tag.lastIndexOf('@')
        const version = tag.substring(start + 1)
        return {
          version,
          hash,
          date,
        }
      })
  }

  check(candidate: Suspect<Metadata>): Result {
    this.checkedVersions.push(candidate.version)
    return runAutomatedCheckAndReportBackFor(candidate)
  }
}

type Metadata = {
  date: string
  hash: string
}

const runAutomatedCheckAndReportBackFor = (candidate: { version: Version } & Metadata) => {
  const versionToCheck = parseInt(candidate.version.split('.')[2] ?? '', 10)
  return versionToCheck < 115 ? 'good' : 'bad'
}

const readTagsFromGit = () => {
  return `
2021-07-30 @production/application@19.38.129 a677a8d86a4cb5ec82df4011deb73dc829e5f2af  -
2021-07-30 @production/application@19.38.128 451b213c10fa3e843a76bc081ddcd3b904dd66fa
2021-07-30 @production/application@19.38.127 5773ea40f3ff09e59e199d52adc4c7e61c8f35ff
2021-07-30 @production/application@19.38.126 22775bb863da34847c9f0d473efd1b18dbdf1bc6
2021-07-30 @production/application@19.38.125 4ec1ddc62215728bd29a0585acf53a6df515864b
2021-07-29 @production/application@19.38.124 38c79787e439ad16a0f4e3ac67a3d415dd8d88ca
2021-07-29 @production/application@19.38.123 c06bc7bb1a131e9ceed5d7f2c15ed662c4a84dec
2021-07-29 @production/application@19.38.122 c267bf67053713eb0797559b57ed2dd2a8ed536f
2021-07-29 @production/application@19.38.121 df2a637624fc6696283b9a7cbb5e3adecb608b8a
2021-07-29 @production/application@19.38.120 7e54ddbb08335955e10c682979e95dc9716310eb
2021-07-28 @production/application@19.38.119 3c14920475a031c20bf4eee543c7ee84a9548792
2021-07-28 @production/application@19.38.118 b4efd8dc8a71909cf6a1099c5aca5c63845b4366  2
2021-07-28 @production/application@19.38.117 881dee882e3c43ff8b159aec55a5a39d8053319f
2021-07-28 @production/application@19.38.116 801848fa0c6dce08fed44888e220a282477530e2
2021-07-28 @production/application@19.38.115 f90a2e144fc02d313688d89e77c53c94a39e6e14  4
2021-07-28 @production/application@19.38.114 fbcfcac955cacc80f4816a358e6c1314f3fc6edd  6
2021-07-28 @production/application@19.38.113 48761ff54900e27fc53268616f8876a63585f92a  5
2021-07-27 @production/application@19.38.112 3bba494782ee54aebc87ba8dc4f7eeebe7d5d5dc  3
2021-07-27 @production/application@19.38.111 207dc2ff63e4d5d0388b79cf37a6b8b3488f587d
2021-07-27 @production/application@19.38.110 476382bd63ff39c275aeb6755b752caae6319cdf
2021-07-27 @production/application@19.38.109 41b5b1cf50d713106eff8b2475e1fa550e71a80f
2021-07-27 @production/application@19.38.108 4b9e40f7446ab889b426308994c2dcab446b60b8
2021-07-27 @production/application@19.38.107 a07e201be62c70542b878d38a1ad352fa71e579c  1
2021-07-27 @production/application@19.38.106 7f54dcf358b654c7a25e8c19f47392fb2ee3a685  
2021-07-27 @production/application@19.38.105 bfd8361272d8a908014a8fdc940e31ffd46a2d4b  
2021-07-26 @production/application@19.38.104 83d09744339c2c2b3c3a4ab510cfacb7dbc8bd3e  
2021-07-26 @production/application@19.38.103 445c16329fde38f4a18c305e8ac5d57d8d3a8b88  
2021-07-26 @production/application@19.38.102 45ff82f431045463b565c2baa66eed7a4bb04209  
2021-07-26 @production/application@19.38.101 d9571bfacbac8a6b82e9a8351e7cbdf2bddfab06  
2021-07-25 @production/application@19.38.100 34815499fd39ace3f6c37b238faf9e71c97d4ff1  
2021-07-23 @production/application@19.38.99 8f4b43ac14f6352cba1f98856bbd99ad05036dd8  
2021-07-22 @production/application@19.38.98 8515609d75bc7395ffc58604b9329c036b04fa75  
2021-07-22 @production/application@19.38.97 794d99d5e8a6113ae40c77a2882fbf291ebd6cb6  
2021-07-22 @production/application@19.38.96 a52687504e9a3c723d15b1434de452b14083db8a  
2021-07-22 @production/application@19.38.95 3c654c19320ab5dcfd3e3e9a52113dcc6427f1bb  
2021-07-22 @production/application@19.38.94 b9b4d20dbb9285bb286844a430b0361a9894d119  
2021-07-22 @production/application@19.38.93 f667fad0b585b5122ac121d930332d56bbaa62d5  
2021-07-22 @production/application@19.38.92 50f4737d684821721856389ceb6de34da63fff97  
2021-07-21 @production/application@19.38.91 33140cc1e2e79b91b8c5bf4b6a0091866b36d08e  
2021-07-21 @production/application@19.38.90 2db0bf0da37860e36f12254defb83d167f4972cd  
2021-07-21 @production/application@19.38.89 be886672614f8e87f4ad7fcbaa82d74de757be65  
2021-07-21 @production/application@19.38.88 8fecd20eab1fa7c1664e836f25441e3d98b2acc2  
2021-07-21 @production/application@19.38.87 36b58f01a45a8a67661bb0b8b675c5733507fe50  
2021-07-21 @production/application@19.38.86 0e9a8c0fec7c491ceaaeb6987d112d78f33cbba3  
2021-07-21 @production/application@19.38.85 43a5cd131e1f69df002181e9a937aa5668e3dc5b  -
2021-07-20 @production/application@19.38.84 15a079d8b353bb64f16310a70b23262497d2358f  
2021-07-20 @production/application@19.38.83 b59f417a178eb7de0cccef282142a0b282f143b0  
2021-07-20 @production/application@19.38.82 3017d07237672f57a9bcd1938b6ffd33895f2070  
2021-07-20 @production/application@19.38.81 d2c4e2cf6cfb2ddfa7a14c9b50009b0d6b57c677  
2021-07-20 @production/application@19.38.80 973ccc558d721ac79dd05bcae17eecd057f82a0e
`
}
