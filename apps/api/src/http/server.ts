import { fastify } from 'fastify'
import fastifyCors from '@fastify/cors'
import fastifySwagger from '@fastify/swagger'
import ScalarApiReference from '@scalar/fastify-api-reference'
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod'
import { createAccount } from './routes/auth/create-account'
import { swagger } from './routes/swagger'

const app = fastify().withTypeProvider<ZodTypeProvider>()

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

app.register(fastifyCors)

// Swagger Configuration
app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'SaaS RBAC API',
      description: 'Full-stack SaaS app with multi-tenancy & RBAC',
      version: '0.1.0',
    },
    servers: [],
  },
  transform: jsonSchemaTransform,
})
app.register(ScalarApiReference, {
  routePrefix: '/docs',
  configuration: {
    title: 'SaaS RBAC API',
    theme: 'purple',
  },
})
app.register(swagger)

// Application routes
app.register(createAccount)

// Await for the Fastify App
app.ready()

app.listen({ port: 3333 }).then(() => {
  console.log('HTTP Server listening on port 3333')
})
