import { db } from '@/infra/db'
import { comparePassword } from '@/lib/hash-password'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { BadRequestError } from '../_errors/bad-request-error'

export async function authenticateWithPassword(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/sessions/password',
    {
      schema: {
        tags: ['auth'],
        summary: 'Authenticate with password',
        body: z.object({
          email: z.string().email(),
          password: z.string(),
        }),
        response: {
          201: z.object({ token: z.string() }),
          401: z.object({ message: z.string() }),
          400: z.object({ message: z.string() }),
        },
      },
    },
    async (req, res) => {
      const { email, password } = req.body

      const user = await db.user.findFirst({ where: { email } })

      if (!user) {
        throw new UnauthorizedError('Invalid credentials.')
      }

      if (user?.passwordHash === null) {
        throw new BadRequestError(
          'User does not have a password, use social login.',
        )
      }

      const isPasswordValid = await comparePassword(password, user.passwordHash)

      if (!isPasswordValid) {
        throw new UnauthorizedError('Invalid credentials.')
      }

      const token = await res.jwtSign({ sub: user.id }, { expiresIn: '7d' })

      return res.status(201).send({ token })
    },
  )
}
