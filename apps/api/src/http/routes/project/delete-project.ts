import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { BadRequestError } from '../_errors/bad-request-error'
import { getUserPermissions } from '@/lib/get-user-permissions'
import { projectSchema } from '@saas/auth'
import { auth } from '@/http/middlewares/auth'
import { db } from '@/infra/db'
import { z } from 'zod'

export async function deleteProject(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .delete(
      '/organizations/:slug/projects/:projectId',
      {
        schema: {
          tags: ['project'],
          summary: 'Delete a project',
          security: [
            {
              bearerAuth: [],
            },
          ],
          params: z.object({
            slug: z.string(),
            projectId: z.string(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (req, res) => {
        const userId = await req.getCurrentUserId()
        const { slug, projectId } = req.params

        const { organization, membership } = await req.getUserMembership(slug)

        const project = await db.project.findUnique({
          where: {
            id: projectId,
            organizationId: organization.id,
          },
        })

        if (!project) {
          throw new BadRequestError('Project not found.')
        }

        const { cannot } = getUserPermissions(userId, membership.role)
        const authProject = projectSchema.parse(project)

        if (cannot('delete', authProject)) {
          throw new UnauthorizedError(
            'You are not allowed to delete this project.',
          )
        }

        await db.project.delete({
          where: {
            id: projectId,
          },
        })

        return res.status(204).send()
      },
    )
}
