import { split } from './arrays'

test('split empty array', () => {
  expect(split([])).toStrictEqual({ left: [], center: undefined, right: [] })
})

test('split array with one element', () => {
  expect(split([1])).toStrictEqual({ left: [], center: 1, right: [] })
})

test('split arrays with two elements', () => {
  expect(split([1, 2])).toStrictEqual({ left: [], center: 1, right: [2] })
})

test('split arrays with three elements', () => {
  expect(split([1, 2, 3])).toStrictEqual({ left: [1], center: 2, right: [3] })
})

test('put additional elements into the right first', () => {
  expect(split([1, 2, 3, 4])).toStrictEqual({ left: [1], center: 2, right: [3, 4] })
})

test('keep left and right balanced if possible', () => {
  expect(split([1, 2, 3, 4, 5])).toStrictEqual({ left: [1, 2], center: 3, right: [4, 5] })
})
