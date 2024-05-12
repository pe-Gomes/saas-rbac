import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { db } from '@/infra/db'
import z from 'zod'
import { hashPassword } from '@/lib/hash-password'

export async function passwordReset(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().put(
    '/password/reset',
    {
      schema: {
        tags: ['auth'],
        summary: 'Reset password after requesting recovery',
        body: z.object({
          code: z.string(),
          password: z.string(),
        }),
        response: {
          204: z.null(),
        },
      },
    },
    async (req, res) => {
      const { code, password } = req.body

      const token = await db.token.findUnique({ where: { id: code } })

      if (!token) {
        throw new UnauthorizedError()
      }

      const passwordHash = await hashPassword(password)

      await db.user.update({
        where: { id: token.userId },
        data: { passwordHash },
      })

      return res.status(204).send()
    },
  )
}
