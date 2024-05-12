import { fastifyPlugin } from 'fastify-plugin'
import { UnauthorizedError } from '../routes/_errors/unauthorized-error'
import { type FastifyInstance } from 'fastify'
import { db } from '@/infra/db'

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

    req.getUserMembership = async (orgSlug: string) => {
      const userId = await req.getCurrentUserId()

      const member = await db.member.findFirst({
        where: { userId, organization: { slug: orgSlug } },
        include: {
          organization: true,
        },
      })

      if (!member) {
        throw new UnauthorizedError(
          'You are not a member of this organization.',
        )
      }

      const { organization, ...membership } = member

      return { organization, membership }
    }
  })
})
