import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { BadRequestError } from '../_errors/bad-request-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { getUserPermissions } from '@/lib/get-user-permissions'
import { organizationSchema } from '@saas/auth'
import { auth } from '@/http/middlewares/auth'
import { db } from '@/infra/db'
import { z } from 'zod'

export async function transferOrganization(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .patch(
      '/organizations/:slug/owner',
      {
        schema: {
          tags: ['organization'],
          summary: 'Transfer ownership of an organization',
          security: [
            {
              bearerAuth: [],
            },
          ],
          params: z.object({
            slug: z.string(),
          }),
          body: z.object({
            transferToUserId: z.string().uuid(),
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

        const { transferToUserId } = req.body

        const permissions = getUserPermissions(userId, membership.role)
        const authOrganization = organizationSchema.parse(organization)

        if (permissions.cannot('transfer_ownership', authOrganization)) {
          throw new UnauthorizedError(
            'You are not allowed to transfer a organization.',
          )
        }

        const member = await db.member.findUnique({
          where: {
            organizationId_userId: {
              organizationId: organization.id,
              userId: transferToUserId,
            },
          },
        })

        if (!member) {
          throw new BadRequestError(
            'Target user is not a member of this organization.',
          )
        }

        await db.$transaction([
          db.member.update({
            where: {
              organizationId_userId: {
                organizationId: organization.id,
                userId: member.userId,
              },
            },
            data: {
              role: 'ADMIN',
            },
          }),
          db.organization.update({
            where: {
              id: organization.id,
            },
            data: {
              ownerId: member.userId,
            },
          }),
        ])

        return res.status(204).send()
      },
    )
}
