import crypto from 'node:crypto';

// Token aleatorio de 32 bytes (256 bits) en base64url: se puede poner en una URL o un QR.
export function generateToken() {
  return crypto.randomBytes(32).toString('base64url');
}

// SHA-256 es suficiente para tokens aleatorios largos (a diferencia de las contraseñas,
// no se pueden adivinar). Se guarda el hash para que, si alguien leyera la base de
// datos, no pudiera usar las invitaciones.
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}