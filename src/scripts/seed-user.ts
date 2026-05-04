/**
 * Crea o actualiza un usuario de desarrollo.
 * Requiere: SEED_EMAIL, SEED_PASSWORD. Opcional: SEED_NAME
 *
 * pnpm run seed:user
 */
import * as bcrypt from 'bcrypt';
import { AppDataSource } from '../data-source';
import { User } from '../entities/user.entity';

async function main() {
  const email = process.env.SEED_EMAIL;
  const password = process.env.SEED_PASSWORD;
  const name = process.env.SEED_NAME?.trim() || 'Admin';

  if (!email?.trim() || !password) {
    console.error(
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
    console.log(`Usuario actualizado: ${normalized}`);
  } else {
    await repo.save(
      repo.create({
        email: normalized,
        name,
        passwordHash: hash,
      }),
    );
    console.log(`Usuario creado: ${normalized}`);
  }

  await AppDataSource.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
