import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { RoleSchema } from '@saas/auth'
import { auth } from '@/http/middlewares/auth'
import { db } from '@/infra/db'
import { z } from 'zod'

export async function getManyOrganizations(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organizations',
      {
        schema: {
          tags: ['organization'],
          summary: 'Get organization(s) where user is a member',
          security: [
            {
              bearerAuth: [],
            },
          ],
          response: {
            200: z.object({
              organizations: z.array(
                z.object({
                  id: z.string().uuid(),
                  name: z.string(),
                  slug: z.string(),
                  domain: z.string().nullable(),
                  avatarUrl: z.string().url().nullable(),
                  role: RoleSchema,
                }),
              ),
            }),
          },
        },
      },
      async (req, res) => {
        const userId = await req.getCurrentUserId()

        const orgs = await db.organization.findMany({
          select: {
            id: true,
            name: true,
            slug: true,
            domain: true,
            avatarUrl: true,
            members: {
              select: {
                role: true,
              },
              where: { userId },
            },
          },
          where: {
            members: {
              some: {
                userId,
              },
            },
          },
        })

        const orgWithUserRole = orgs.map(({ members, ...org }) => {
          return {
            ...org,
            role: members[0].role,
          }
        })

        return res.status(200).send({ organizations: orgWithUserRole })
      },
    )
}
