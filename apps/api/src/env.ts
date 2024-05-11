import z from 'zod'

export const env = z
  .object({
    DATABASE_URL: z.string(),
    JWT_SECRET: z.string(),
    PORT: z.coerce.number(),
  })
  .parse({
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    PORT: process.env.PORT,
  })
