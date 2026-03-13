import { Injectable } from '@nestjs/common';
import { env } from '../config/env.js';
import { FileSystemProvider } from './providers/filesystem.js';
import { MinioProvider } from './providers/minio.js';
import type { UploadOptions, UploadResult } from './types.js';
import { FileNotFoundError, UploadFailedError } from './types.js';

type StorageProvider = FileSystemProvider | MinioProvider;

@Injectable()
export class StorageService {
  private provider: StorageProvider;

  constructor() {
    switch (env.STORAGE_TYPE) {
      case 'minio':
        this.provider = new MinioProvider();
        break;
      case 'filesystem':
      default:
        this.provider = new FileSystemProvider();
        break;
    }
  }

  upload(file: Buffer, options: UploadOptions = {}): Promise<UploadResult> {
    return this.provider.upload(file, options);
  }

  delete(key: string): Promise<void> {
    return this.provider.delete(key);
  }

  download(key: string): Promise<Buffer> {
    return this.provider.download(key);
  }

  getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    return this.provider.getSignedUrl(key, expiresIn);
  }

  getPublicUrl(key: string): string {
    return this.provider.getPublicUrl(key);
  }

  getAssetUrl(key: string): string {
    return this.provider.getAssetUrl(key);
  }

  getFolderFromUrl(url: string): string | null {
    return this.provider.getFolderFromUrl(url);
  }

  getKeyFromUrl(url: string): string | null {
    return this.provider.getKeyFromUrl(url);
  }
}

export type { UploadOptions, UploadResult };
export { FileNotFoundError, UploadFailedError };
