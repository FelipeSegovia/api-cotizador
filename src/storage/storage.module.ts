import { Module } from '@nestjs/common';
import { s3ClientProvider } from './s3.provider';
import { StorageService } from './storage.service';

@Module({
  providers: [s3ClientProvider, StorageService],
  exports: [StorageService],
})
export class StorageModule {}
