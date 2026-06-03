import {
  DeleteObjectCommand,
  PutObjectCommand,
  type S3Client,
} from '@aws-sdk/client-s3';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { S3_CLIENT } from './s3.provider';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(@Inject(S3_CLIENT) private readonly s3: S3Client) {}

  get bucket(): string {
    const name = process.env.DO_SPACES_BUCKET?.trim();
    if (!name) {
      throw new Error('DO_SPACES_BUCKET no configurado');
    }
    return name;
  }

  buildPublicUrl(key: string): string {
    const base = process.env.DO_SPACES_PUBLIC_URL?.trim();
    if (!base) {
      throw new Error('DO_SPACES_PUBLIC_URL no configurado');
    }
    const normalizedBase = base.replace(/\/$/, '');
    const normalizedKey = key.replace(/^\//, '');
    return `${normalizedBase}/${normalizedKey}`;
  }

  async uploadPublicObject(
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<void> {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        ACL: 'public-read',
      }),
    );
    this.logger.log({
      msg: 'Objeto subido a Spaces',
      key,
      bytes: body.length,
      contentType,
    });
  }

  async deleteObject(key: string): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
    this.logger.log({ msg: 'Objeto eliminado de Spaces', key });
  }
}
