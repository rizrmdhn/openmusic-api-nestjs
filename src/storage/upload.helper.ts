import { InternalServerErrorException } from '@nestjs/common';
import type { Request } from 'express';
import sharp from 'sharp';
import type { StorageService } from './storage.service.js';
import {
  assertValidFileBuffer,
  ALLOWED_MIME_TYPES,
  FILE_SIZE_LIMITS,
} from './file-validator.js';
import type { UploadResult } from './types.js';

type MulterFile = Express.Multer.File;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ImageConversionOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  effort?: number;
}

export interface ProcessAndUploadImageOptions {
  /** Storage folder name (e.g. "banners", "albums", "avatars") */
  folder: string;
  /** Max file size in bytes. Defaults to FILE_SIZE_LIMITS.IMAGE (5MB) */
  maxSize?: number;
  /** Allowed MIME types. Defaults to ALLOWED_MIME_TYPES.IMAGE */
  allowedMimeTypes?: readonly string[];
  /** WebP conversion options */
  conversion?: ImageConversionOptions;
}

export interface ProcessAndUploadFileOptions {
  /** Storage folder name (e.g. "documents", "exports") */
  folder: string;
  /** Max file size in bytes. Defaults to FILE_SIZE_LIMITS.DOCUMENT (50MB) */
  maxSize?: number;
  /** Allowed MIME types. Defaults to ALLOWED_MIME_TYPES.DOCUMENT */
  allowedMimeTypes?: readonly string[];
  /** Content type to store. Defaults to the file's own type */
  contentType?: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function convertToWebP(
  buffer: Buffer,
  filename: string,
  options: ImageConversionOptions = {},
): Promise<{ buffer: Buffer; filename: string }> {
  const { quality = 80, effort = 4, maxWidth, maxHeight } = options;

  let pipeline = sharp(buffer);

  if (maxWidth || maxHeight) {
    pipeline = pipeline.resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  const converted = await pipeline.webp({ quality, effort }).toBuffer();

  const baseName = filename.replace(/\.[^.]+$/, '');
  return {
    buffer: converted,
    filename: `${baseName}.webp`,
  };
}

// ---------------------------------------------------------------------------
// Image upload helpers
// ---------------------------------------------------------------------------

/**
 * Validates, converts to WebP, and uploads an image in one step.
 *
 * @example
 * ```ts
 * const result = await processAndUploadImage(file, storage, { folder: 'albums' });
 * ```
 */
export async function processAndUploadImage(
  file: MulterFile,
  storage: StorageService,
  options: ProcessAndUploadImageOptions,
): Promise<UploadResult> {
  const {
    folder,
    maxSize = FILE_SIZE_LIMITS.IMAGE,
    allowedMimeTypes = ALLOWED_MIME_TYPES.IMAGE,
    conversion = {},
  } = options;

  await assertValidFileBuffer(file.buffer, file.originalname, file.mimetype, {
    maxSize,
    allowedMimeTypes,
  });

  const converted = await convertToWebP(
    file.buffer,
    file.originalname,
    conversion,
  );

  return storage.upload(converted.buffer, {
    filename: converted.filename,
    folder,
    contentType: 'image/webp',
  });
}

/**
 * Same as processAndUploadImage but returns only the key, or undefined if no file.
 */
export async function processAndUploadImageIfPresent(
  file: MulterFile | undefined | null,
  storage: StorageService,
  options: ProcessAndUploadImageOptions,
): Promise<string | undefined> {
  if (!file) return undefined;
  const result = await processAndUploadImage(file, storage, options);
  return result.key;
}

/**
 * Validates, converts to WebP, and uploads multiple images with concurrency control.
 */
export async function processAndUploadImages(
  files: MulterFile[],
  storage: StorageService,
  options: ProcessAndUploadImageOptions,
  { concurrency = 2 }: { concurrency?: number } = {},
): Promise<string[]> {
  const results: string[] = [];

  for (let i = 0; i < files.length; i += concurrency) {
    const batch = files.slice(i, i + concurrency);
    const keys = await Promise.all(
      batch.map((f) =>
        processAndUploadImage(f, storage, options).then((r) => r.key),
      ),
    );
    results.push(...keys);
  }

  return results;
}

// ---------------------------------------------------------------------------
// General file upload helpers
// ---------------------------------------------------------------------------

/**
 * Validates and uploads any file (no image conversion).
 *
 * @example
 * ```ts
 * const result = await processAndUploadFile(file, storage, { folder: 'exports' });
 * ```
 */
export async function processAndUploadFile(
  file: MulterFile,
  storage: StorageService,
  options: ProcessAndUploadFileOptions,
): Promise<UploadResult> {
  const {
    folder,
    maxSize = FILE_SIZE_LIMITS.DOCUMENT,
    allowedMimeTypes = ALLOWED_MIME_TYPES.DOCUMENT,
    contentType,
  } = options;

  await assertValidFileBuffer(file.buffer, file.originalname, file.mimetype, {
    maxSize,
    allowedMimeTypes,
  });

  return storage.upload(file.buffer, {
    filename: file.originalname,
    folder,
    contentType: contentType ?? file.mimetype,
  });
}

/**
 * Same as processAndUploadFile but returns only the key, or undefined if no file.
 */
export async function processAndUploadFileIfPresent(
  file: MulterFile | undefined | null,
  storage: StorageService,
  options: ProcessAndUploadFileOptions,
): Promise<string | undefined> {
  if (!file) return undefined;
  const result = await processAndUploadFile(file, storage, options);
  return result.key;
}

// ---------------------------------------------------------------------------
// Storage file management helpers
// ---------------------------------------------------------------------------

/**
 * Deletes a previous file from storage given its URL.
 * Safe to call with null/undefined — returns immediately.
 *
 * @example
 * ```ts
 * await deleteStorageFile(existingRecord.coverUrl, storage);
 * ```
 */
export async function deleteStorageFile(
  url: string | null | undefined,
  storage: StorageService,
): Promise<void> {
  if (!url) return;

  const key = storage.getKeyFromUrl(url);

  if (!key) {
    throw new InternalServerErrorException('Gagal menghapus file sebelumnya.');
  }

  await storage.delete(key);
}

/**
 * Replaces an old file in storage with a new upload.
 * Only deletes the old file if a new key is provided, the old URL exists,
 * and the new key differs from the old URL's key.
 *
 * @example
 * ```ts
 * await replaceStorageFile(uploadedFile?.key, existingRecord.coverUrl, storage);
 * ```
 */
export async function replaceStorageFile(
  newKey: string | undefined | null,
  oldUrl: string | undefined | null,
  storage: StorageService,
): Promise<void> {
  if (!newKey || !oldUrl) return;

  const oldKey = storage.getKeyFromUrl(oldUrl);
  if (oldKey && oldKey !== newKey) {
    await deleteStorageFile(oldUrl, storage);
  }
}

export type { MulterFile };
