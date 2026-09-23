export async function withTimeout<T>(promise: Promise<T>, ms: number, onTimeout?: () => void): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          onTimeout?.()
          const error = new Error('操作超时')
          error.name = 'AbortError'
          reject(error)
        }, ms)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}
