import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { BadRequestError } from '../_errors/bad-request-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { organizationSchema } from '@saas/auth'
import { auth } from '@/http/middlewares/auth'
import { db } from '@/infra/db'
import { z } from 'zod'
import { getUserPermissions } from '@/lib/get-user-permissions'

export async function updateOrganization(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/organizations/:slug',
      {
        schema: {
          tags: ['organization'],
          summary: 'Update an organization',
          security: [
            {
              bearerAuth: [],
            },
          ],
          params: z.object({
            slug: z.string(),
          }),
          body: z.object({
            name: z.string(),
            domain: z.string().optional(),
            shouldAttachUsersByDomain: z.boolean().optional(),
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

        const { name, domain, shouldAttachUsersByDomain } = req.body

        const permissions = getUserPermissions(userId, membership.role)
        const authOrganization = organizationSchema.parse(organization)

        if (permissions.cannot('update', authOrganization)) {
          throw new UnauthorizedError(
            'You are not allowed to update organization.',
          )
        }

        if (domain) {
          const domainExists = await db.organization.findFirst({
            where: { domain, id: { not: organization.id } },
          })

          if (domainExists) {
            throw new BadRequestError('Domain is already in use.')
          }
        }

        await db.organization.update({
          where: {
            id: organization.id,
          },
          data: {
            name,
            domain,
            shouldAttachUsersByDomain,
          },
        })

        return res.status(204).send()
      },
    )
}
