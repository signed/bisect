export type Split<T> = {
  left: T[]
  center: T | void
  right: T[]
}

export const split = <T>(input: T[]): Split<T> => {
  const halfIndex = Math.ceil(input.length / 2)
  const left = input.slice(0, halfIndex)
  const center = left.pop()
  const right = input.slice(halfIndex, input.length)
  return {
    left,
    center,
    right,
  }
}
