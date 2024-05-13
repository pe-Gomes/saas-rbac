import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { organizationSchema } from '@saas/auth'
import { auth } from '@/http/middlewares/auth'
import { db } from '@/infra/db'
import { z } from 'zod'
import { getUserPermissions } from '@/lib/get-user-permissions'
import { permissions } from '@saas/auth/src/permissions'

export async function shutdownOrganization(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .delete(
      '/organizations/:slug',
      {
        schema: {
          tags: ['organization'],
          summary: 'Delete an organization',
          security: [
            {
              bearerAuth: [],
            },
          ],
          params: z.object({
            slug: z.string(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (req, res) => {
        const { slug } = req.params

        const userId = await req.getCurrentUserId()
        const { membership, organization } = await req.getUserMembership(slug)

        const { cannot } = getUserPermissions(userId, membership.role)
        const authOrganization = organizationSchema.parse(organization)

        if (cannot('delete', authOrganization)) {
          throw new UnauthorizedError(
            'You are not allowed to delete this organization.',
          )
        }

        await db.organization.delete({
          where: {
            id: organization.id,
          },
        })

        return res.status(204).send()
      },
    )
}
