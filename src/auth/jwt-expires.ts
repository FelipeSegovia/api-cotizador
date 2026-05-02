/** JWT `expiresIn` string for `JwtModule` / `signOptions` (ej. `900s`, `15m`). */
export function jwtExpiresInString(): string {
  const v = process.env.JWT_EXPIRES_IN?.trim();
  return v && v.length > 0 ? v : '900s';
}

/** Valor numérico en segundos para el campo `expiresIn` del body de login. */
export function jwtExpiresInSeconds(): number {
  const v = jwtExpiresInString();
  const m = /^(\d+)\s*(s|m|h)?$/i.exec(v);
  if (!m) {
    return 900;
  }
  const n = parseInt(m[1], 10);
  const unit = (m[2] ?? 's').toLowerCase();
  if (unit === 'm') {
    return n * 60;
  }
  if (unit === 'h') {
    return n * 3600;
  }
  return n;
}
