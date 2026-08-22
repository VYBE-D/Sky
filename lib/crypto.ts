import crypto from 'crypto'
const key = () => Buffer.from(process.env.SECRET_ENCRYPTION_KEY || '', 'hex')
export function encryptSecret(value: string) {
  const k = key(); if (k.length !== 32) throw new Error('SECRET_ENCRYPTION_KEY must be a 64-character hex key')
  const iv = crypto.randomBytes(12); const cipher = crypto.createCipheriv('aes-256-gcm', k, iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  return `${iv.toString('hex')}.${cipher.getAuthTag().toString('hex')}.${encrypted.toString('hex')}`
}
export function decryptSecret(payload: string) {
  const k = key(); const [ivHex, tagHex, dataHex] = payload.split('.')
  const decipher = crypto.createDecipheriv('aes-256-gcm', k, Buffer.from(ivHex, 'hex')); decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
  return Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]).toString('utf8')
}
