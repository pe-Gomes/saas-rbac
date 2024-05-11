import { hash, compare } from 'bcryptjs'

const salt = 6 as const

export async function hashPassword(password: string) {
  return await hash(password, salt)
}

export async function comparePassword(
  password: string,
  hashedPassword: string,
) {
  return await compare(password, hashedPassword)
}
