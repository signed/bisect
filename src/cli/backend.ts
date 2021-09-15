import { ResponseTransformer, rest } from 'msw'
import { setupServer } from 'msw/node'

export const html = <BodyType extends string>(body: BodyType): ResponseTransformer<BodyType> => {
  return (res) => {
    res.headers.set('Content-Type', 'text/html')
    res.body = body
    return res
  }
}

export const serverRule = () => {
  const server = setupServer()
  beforeEach(() => {
    server.listen({ onUnhandledRequest: 'warn' })
  })
  afterEach(() => {
    server.close()
  })
  const deploy = (version: string, url: string) => {
    server.use(
      rest.get<{}, string>(url, (_req, res, ctx) => {
        return res(html('version:' + version), ctx.status(200))
      }),
    )
  }

  const connectionProblems = () => {
    // connection will be refused
    server.resetHandlers()
  }

  return {
    server,
    deploy,
    connectionProblems,
  }
}
