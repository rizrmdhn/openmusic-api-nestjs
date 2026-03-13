import { Logger } from '@nestjs/common';
import * as Minio from 'minio';
import { v7 as uuidv7 } from 'uuid';
import path from 'path';
import type { UploadOptions, UploadResult } from '../types.js';
import { UploadFailedError, FileNotFoundError } from '../types.js';
import { generateDateBasedPath } from '../utils.js';
import { env } from '../../config/env.js';

export class MinioProvider {
  private readonly logger = new Logger(MinioProvider.name);
  private client: Minio.Client;
  private bucket: string;
  private endpoint: string;
  private port: number;
  private useSSL: boolean;

  constructor() {
    this.endpoint = env.MINIO_ENDPOINT || 'localhost';
    this.port = env.MINIO_PORT || 9000;
    this.useSSL = env.MINIO_USE_SSL ?? false;
    this.bucket = env.MINIO_BUCKET || 'uploads';

    this.client = new Minio.Client({
      endPoint: this.endpoint,
      port: this.port,
      useSSL: this.useSSL,
      accessKey: env.MINIO_ACCESS_KEY || '',
      secretKey: env.MINIO_SECRET_KEY || '',
    });

    this.logger.log(
      `Connected to MinIO at ${this.endpoint}:${this.port}, bucket: ${this.bucket}`,
    );
  }

  private async ensureBucket(): Promise<void> {
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(this.bucket, '');
      }
    } catch (error) {
      throw new UploadFailedError('Failed to ensure bucket exists', error);
    }
  }

  private generateKey(
    filename?: string,
    folder?: string,
  ): { filename: string; key: string } {
    const ext = filename ? path.extname(filename) : '';
    const name = filename ? path.basename(filename, ext) : 'file';
    const uniqueId = uuidv7();

    const cleanName = name.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
    const generatedFileName = `${cleanName}-${uniqueId}${ext}`;
    const folderName = folder || 'general';
    const dateBasedPath = generateDateBasedPath(folderName);

    return {
      filename: generatedFileName,
      key: `${dateBasedPath}/${generatedFileName}`,
    };
  }

  async upload(
    file: Buffer,
    options: UploadOptions = {},
  ): Promise<UploadResult> {
    await this.ensureBucket();

    const { filename, key } = this.generateKey(
      options.filename,
      options.folder,
    );
    const metadata = {
      'Content-Type': options.contentType || 'application/octet-stream',
    };

    try {
      await this.client.putObject(
        this.bucket,
        key,
        file,
        file.length,
        metadata,
      );
    } catch (error) {
      throw new UploadFailedError('MinIO upload failed', error);
    }

    const url = options.isPublic
      ? this.getPublicUrl(key)
      : await this.getSignedUrl(key);

    return {
      filename,
      key,
      url,
      size: file.length,
      contentType: options.contentType || 'application/octet-stream',
    };
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.removeObject(this.bucket, key);
    } catch {
      throw new FileNotFoundError(key);
    }
  }

  async download(key: string): Promise<Buffer> {
    try {
      const stream = await this.client.getObject(this.bucket, key);
      const chunks: Buffer<ArrayBufferLike>[] = [];

      return await new Promise<Buffer>((resolve, reject) => {
        stream.on('data', (chunk: Buffer<ArrayBufferLike>) => {
          chunks.push(chunk);
        });
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', (err) => {
          reject(
            err.name === 'NoSuchKey'
              ? new FileNotFoundError(key)
              : new UploadFailedError('Failed to download file', err),
          );
        });
      });
    } catch (error) {
      if (error instanceof FileNotFoundError) throw error;
      throw new UploadFailedError('Failed to download file', error);
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      return await this.client.presignedGetObject(this.bucket, key, expiresIn);
    } catch (error) {
      throw new UploadFailedError('Failed to generate signed URL', error);
    }
  }

  getPublicUrl(key: string): string {
    const protocol = this.useSSL ? 'https' : 'http';
    return `${protocol}://${this.endpoint}:${this.port}/${this.bucket}/${key}`;
  }

  getAssetUrl(key: string): string {
    const protocol = this.useSSL ? 'https' : 'http';
    return `${protocol}://${this.endpoint}:${this.port}/${this.bucket}/${key}`;
  }

  getFolderFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const bucketPrefix = `/${this.bucket}/`;
      if (!pathname.startsWith(bucketPrefix)) return null;
      const key = pathname.slice(bucketPrefix.length);
      const lastSlashIndex = key.lastIndexOf('/');
      if (lastSlashIndex === -1) return null;
      return key.slice(0, lastSlashIndex);
    } catch {
      return null;
    }
  }

  getKeyFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const bucketPrefix = `/${this.bucket}/`;
      if (!pathname.startsWith(bucketPrefix)) return null;
      return pathname.slice(bucketPrefix.length);
    } catch {
      return null;
    }
  }
}
