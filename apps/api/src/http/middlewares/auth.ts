import { fastifyPlugin } from 'fastify-plugin'
import { UnauthorizedError } from '../routes/_errors/unauthorized-error'
import { type FastifyInstance } from 'fastify'

export const auth = fastifyPlugin(async (app: FastifyInstance) => {
  app.addHook('preHandler', async (req, res) => {
    req.getCurrentUserId = async () => {
      try {
        const { sub } = await req.jwtVerify<{ sub: string }>()

        return sub
      } catch {
        throw new UnauthorizedError('Invalid authentication token.')
      }
    }
  })
})
