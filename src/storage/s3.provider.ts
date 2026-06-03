import { Logger, type Provider } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';

export const S3_CLIENT = Symbol('S3_CLIENT');

/**
 * Cliente S3 compatible con DigitalOcean Spaces.
 * Si faltan credenciales, se inicializa igualmente para permitir arranque en dev.
 */
export const s3ClientProvider: Provider = {
  provide: S3_CLIENT,
  useFactory: (): S3Client => {
    const accessKeyId = process.env.DO_SPACES_ACCESS_KEY_ID?.trim();
    const secretAccessKey = process.env.DO_SPACES_SECRET_ACCESS_KEY?.trim();
    const region = process.env.DO_SPACES_REGION?.trim() || 'us-east-1';
    const endpoint = process.env.DO_SPACES_ENDPOINT?.trim();

    if (!accessKeyId || !secretAccessKey || !endpoint) {
      new Logger('S3Client').warn({
        msg: 'DO Spaces no configurado por completo; el cliente S3 se inicializa sin credenciales válidas',
      });
    }

    return new S3Client({
      region,
      endpoint,
      credentials:
        accessKeyId && secretAccessKey
          ? { accessKeyId, secretAccessKey }
          : undefined,
      forcePathStyle: false,
    });
  },
};
