import { FastifyInstance } from 'fastify'
import { ZodError } from 'zod'
import { BadRequestError } from './routes/_errors/bad-request-error'
import { UnauthorizedError } from './routes/_errors/unauthorized-error'

type FastifyErrorHandler = FastifyInstance['errorHandler']

export const errorHandler: FastifyErrorHandler = (err, req, res) => {
  if (err instanceof ZodError) {
    return res.status(422).send({
      message: 'Unprocessable entity',
      errors: err.flatten().fieldErrors,
    })
  }

  if (err instanceof BadRequestError) {
    return res.status(400).send({ message: err.message })
  }

  if (err instanceof UnauthorizedError) {
    return res.status(401).send({ message: err.message })
  }

  console.error(err)

  return res.status(500).send({ message: 'Internal server error.' })
}
