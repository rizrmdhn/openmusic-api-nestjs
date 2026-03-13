import { Logger } from '@nestjs/common';
import fs from 'fs/promises';
import path from 'path';
import { v7 as uuidv7 } from 'uuid';
import type { UploadOptions, UploadResult } from '../types.js';
import { UploadFailedError, FileNotFoundError } from '../types.js';
import { generateDateBasedPath } from '../utils.js';
import { env } from '../../config/env.js';

export class FileSystemProvider {
  private readonly logger = new Logger(FileSystemProvider.name);
  private uploadsDir: string;
  private baseUrl: string;

  constructor() {
    this.uploadsDir = env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');
    this.baseUrl = env.BASE_URL || 'http://localhost:3000';

    this.logger.log(`Using uploads directory: ${this.uploadsDir}`);
  }

  private async ensureDir(dir: string): Promise<void> {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
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
    const { filename, key } = this.generateKey(
      options.filename,
      options.folder,
    );
    const filePath = path.join(this.uploadsDir, key);
    const fileDir = path.dirname(filePath);

    try {
      await this.ensureDir(this.uploadsDir);
      await this.ensureDir(fileDir);
      await fs.writeFile(filePath, file);
    } catch (error) {
      throw new UploadFailedError('Failed to write file', error);
    }

    return {
      filename,
      key,
      url: this.getPublicUrl(key),
      size: file.length,
      contentType: options.contentType || 'application/octet-stream',
    };
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(this.uploadsDir, key);
    try {
      await fs.unlink(filePath);
    } catch {
      throw new FileNotFoundError(key);
    }
  }

  async download(key: string): Promise<Buffer> {
    const filePath = path.join(this.uploadsDir, key);
    try {
      return await fs.readFile(filePath);
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        throw new FileNotFoundError(key);
      }
      throw new UploadFailedError('Failed to read file', error);
    }
  }

  getSignedUrl(key: string): Promise<string> {
    return Promise.resolve(this.getPublicUrl(key));
  }

  getPublicUrl(key: string): string {
    return `${this.baseUrl}/api/uploads/${key}`;
  }

  getAssetUrl(key: string): string {
    return `${this.baseUrl}/api/public/${key}`;
  }

  getFolderFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const uploadsPrefix = '/api/uploads/';
      if (!pathname.startsWith(uploadsPrefix)) return null;
      const key = pathname.slice(uploadsPrefix.length);
      const lastSlashIndex = key.lastIndexOf('/');
      if (lastSlashIndex === -1) return null;
      return key.slice(0, lastSlashIndex);
    } catch {
      return null;
    }
  }

  getKeyFromUrl(urlOrKey: string): string | null {
    if (!urlOrKey.startsWith('http://') && !urlOrKey.startsWith('https://')) {
      if (urlOrKey.includes('/') && urlOrKey.length > 0) return urlOrKey;
      return null;
    }
    try {
      const urlObj = new URL(urlOrKey);
      const pathname = urlObj.pathname;
      const uploadsPrefix = '/api/uploads/';
      if (!pathname.startsWith(uploadsPrefix)) return null;
      return pathname.slice(uploadsPrefix.length);
    } catch {
      return null;
    }
  }
}
