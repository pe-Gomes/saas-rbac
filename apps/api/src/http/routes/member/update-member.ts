import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { getUserPermissions } from '@/lib/get-user-permissions'
import { RoleSchema, organizationSchema } from '@saas/auth'
import { auth } from '@/http/middlewares/auth'
import { db } from '@/infra/db'
import { z } from 'zod'

export async function updateMemberRole(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .patch(
      '/organizations/:slug/members/:memberId/role',
      {
        schema: {
          tags: ['member'],
          summary: 'Update member role from an organization',
          security: [
            {
              bearerAuth: [],
            },
          ],
          params: z.object({
            slug: z.string(),
            memberId: z.string().uuid(),
          }),
          body: z.object({
            role: RoleSchema,
          }),
          response: {
            204: z.null(),
            400: z.object({
              message: z.string().uuid(),
            }),
          },
        },
      },
      async (req, res) => {
        const userId = await req.getCurrentUserId()
        const { slug, memberId } = req.params

        const { organization, membership } = await req.getUserMembership(slug)

        const { cannot } = getUserPermissions(userId, membership.role)
        const authOrganization = organizationSchema.parse(organization)

        if (cannot('manage', authOrganization)) {
          throw new UnauthorizedError(
            'You are not allowed to manage the organization members.',
          )
        }

        const { role } = req.body

        await db.member.update({
          where: {
            organizationId_userId: {
              organizationId: organization.id,
              userId: memberId,
            },
          },
          data: {
            role,
          },
        })

        return res.status(204).send()
      },
    )
}
