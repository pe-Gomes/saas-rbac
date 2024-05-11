import { comparePassword, hashPassword } from './hash-password'

describe('Should hash and compare passwords', () => {
  test('Should hash successfully a string', async () => {
    const password = 'pass123'
    const hashedPassword = await hashPassword(password)
    expect(hashedPassword).not.toBe(password)
  })
  test('Should compare successfully a string', async () => {
    const password = 'pass123'
    const hashedPassword = await hashPassword(password)
    expect(await comparePassword(password, hashedPassword)).toBe(true)
  })
  test('Should not return true comparing a wrong password', async () => {
    const password = 'pass123'
    const hashedPassword = await hashPassword(password)
    expect(await comparePassword('wrongPass', hashedPassword)).toBe(false)
  })
})
