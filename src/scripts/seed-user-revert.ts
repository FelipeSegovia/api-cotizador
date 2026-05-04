/**
 * Elimina el usuario creado con seed:user (mismo SEED_EMAIL).
 *
 * pnpm run seed:user:revert
 */
import { AppDataSource } from '../data-source';
import { User } from '../entities/user.entity';

async function main() {
  const email = process.env.SEED_EMAIL;
  if (!email?.trim()) {
    console.error(
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
    console.log(`Usuario eliminado: ${normalized}`);
  } else {
    console.log(`No había usuario con email ${normalized}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
