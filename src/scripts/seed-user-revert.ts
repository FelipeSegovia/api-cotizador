/**
 * Elimina el usuario creado con seed:user (mismo SEED_EMAIL).
 *
 * pnpm run seed:user:revert
 */
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
}).child({ context: 'seed:user-revert' });

async function main() {
  const email = process.env.SEED_EMAIL;
  if (!email?.trim()) {
    log.error(
      'Defina SEED_EMAIL en el entorno (mismo valor que al ejecutar seed:user).',
    );
    process.exit(1);
  }

  const normalized = email.trim().toLowerCase();
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(User);
  const result = await repo.delete({ email: normalized });
  await AppDataSource.destroy();

  if (result.affected && result.affected > 0) {
    log.info({ email: normalized }, 'Usuario eliminado');
  } else {
    log.info({ email: normalized }, 'No había usuario con ese email');
  }
}

main().catch((err: unknown) => {
  log.error(err, 'Error ejecutando seed:user:revert');
  process.exit(1);
});
