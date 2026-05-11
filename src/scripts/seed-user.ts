/**
 * Crea o actualiza un usuario de desarrollo.
 * Requiere: SEED_EMAIL, SEED_PASSWORD. Opcional: SEED_NAME
 *
 * pnpm run seed:user
 */
import * as bcrypt from 'bcrypt';
import pino from 'pino';
import { AppDataSource } from '../data-source';
import { User } from '../entities/user.entity';

const log = pino({
  messageKey: 'message',
  errorKey: 'err',
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level(label) {
      return { level: label };
    },
  },
}).child({ context: 'seed:user' });

async function main() {
  const email = process.env.SEED_EMAIL;
  const password = process.env.SEED_PASSWORD;
  const name = process.env.SEED_NAME?.trim() || 'Admin';

  if (!email?.trim() || !password) {
    log.error(
      'Defina SEED_EMAIL y SEED_PASSWORD en el entorno (ej. archivo .env).',
    );
    process.exit(1);
  }

  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(User);
  const normalized = email.trim().toLowerCase();
  const hash = await bcrypt.hash(password, 10);
  const existing = await repo.findOne({ where: { email: normalized } });

  if (existing) {
    existing.passwordHash = hash;
    existing.name = name;
    await repo.save(existing);
    log.info({ email: normalized }, 'Usuario actualizado');
  } else {
    await repo.save(
      repo.create({
        email: normalized,
        name,
        passwordHash: hash,
      }),
    );
    log.info({ email: normalized }, 'Usuario creado');
  }

  await AppDataSource.destroy();
}

main().catch((err: unknown) => {
  log.error(err, 'Error ejecutando seed');
  process.exit(1);
});
