import fastify, { FastifyInstance } from 'fastify'

export async function swagger(app: FastifyInstance) {
  app.get('/openapi.json', async (req, res) => {
    return app.swagger()
  })
}
