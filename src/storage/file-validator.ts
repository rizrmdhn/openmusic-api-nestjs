import { BadRequestException } from '@nestjs/common';
import { fileTypeFromBuffer } from 'file-type';

export const FILE_SIZE_LIMITS = {
  DEFAULT: 10 * 1024 * 1024,
  IMAGE: 5 * 1024 * 1024,
  DOCUMENT: 50 * 1024 * 1024,
  AVATAR: 2 * 1024 * 1024,
} as const;

export const ALLOWED_MIME_TYPES = {
  IMAGE: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ],
  DOCUMENT: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  GENERAL: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
  ],
} as const;

const DANGEROUS_EXTENSIONS = [
  '.exe',
  '.dll',
  '.bat',
  '.cmd',
  '.sh',
  '.bash',
  '.ps1',
  '.vbs',
  '.js',
  '.jse',
  '.ws',
  '.wsf',
  '.msc',
  '.msi',
  '.msp',
  '.com',
  '.scr',
  '.hta',
  '.cpl',
  '.jar',
  '.php',
  '.phtml',
  '.php3',
  '.php4',
  '.php5',
  '.asp',
  '.aspx',
  '.jsp',
  '.py',
  '.rb',
  '.pl',
];

export interface FileValidationOptions {
  maxSize?: number;
  allowedMimeTypes?: readonly string[];
  verifyMagicBytes?: boolean;
  messages?: {
    tooLarge?: string;
    invalidType?: string;
    invalidMagicBytes?: string;
    dangerousExtension?: string;
  };
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  mimeType?: string;
  detectedMimeType?: string;
  size?: number;
}

async function detectFileType(
  buffer: Buffer,
): Promise<{ mime: string; ext: string } | null> {
  const result = await fileTypeFromBuffer(buffer);
  return result ? { mime: result.mime, ext: result.ext } : null;
}

function isMimeTypeCompatible(
  claimedMime: string,
  detectedMime: string | null,
): boolean {
  if (!detectedMime) {
    const undetectableTypes = ['image/svg+xml', 'text/plain', 'text/csv'];
    return undetectableTypes.includes(claimedMime);
  }

  if (claimedMime === detectedMime) return true;

  const officeZipTypes = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
  ];
  if (
    officeZipTypes.includes(claimedMime) &&
    officeZipTypes.includes(detectedMime)
  ) {
    return true;
  }

  const legacyOfficeTypes = [
    'application/msword',
    'application/vnd.ms-excel',
    'application/vnd.ms-powerpoint',
  ];
  if (legacyOfficeTypes.includes(claimedMime)) {
    return (
      detectedMime === 'application/x-cfb' ||
      legacyOfficeTypes.includes(detectedMime)
    );
  }

  return false;
}

function hasDangerousExtension(filename: string): boolean {
  const lowerFilename = filename.toLowerCase();
  const parts = lowerFilename.split('.');
  if (parts.length > 2) {
    for (let i = 0; i < parts.length - 1; i++) {
      if (DANGEROUS_EXTENSIONS.includes(`.${parts[i]}`)) return true;
    }
  }
  for (const ext of DANGEROUS_EXTENSIONS) {
    if (lowerFilename.endsWith(ext)) return true;
  }
  return false;
}

export function validateFile(
  file: File,
  options: FileValidationOptions = {},
): FileValidationResult {
  const {
    maxSize = FILE_SIZE_LIMITS.DEFAULT,
    allowedMimeTypes = ALLOWED_MIME_TYPES.GENERAL,
    messages = {},
  } = options;

  if (hasDangerousExtension(file.name)) {
    return {
      valid: false,
      error:
        messages.dangerousExtension ||
        'Jenis file tidak diizinkan untuk alasan keamanan',
    };
  }

  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return {
      valid: false,
      error: messages.tooLarge || `Ukuran file maksimal ${maxSizeMB}MB`,
      size: file.size,
    };
  }

  if (!allowedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      error:
        messages.invalidType ||
        'Jenis file tidak diizinkan. Gunakan format yang didukung.',
      mimeType: file.type,
    };
  }

  return { valid: true, mimeType: file.type, size: file.size };
}

export async function validateFileBuffer(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  options: FileValidationOptions = {},
): Promise<FileValidationResult> {
  const {
    maxSize = FILE_SIZE_LIMITS.DEFAULT,
    allowedMimeTypes = ALLOWED_MIME_TYPES.GENERAL,
    verifyMagicBytes = true,
    messages = {},
  } = options;

  if (hasDangerousExtension(filename)) {
    return {
      valid: false,
      error:
        messages.dangerousExtension ||
        'Jenis file tidak diizinkan untuk alasan keamanan',
    };
  }

  if (buffer.length > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return {
      valid: false,
      error: messages.tooLarge || `Ukuran file maksimal ${maxSizeMB}MB`,
      size: buffer.length,
    };
  }

  if (!allowedMimeTypes.includes(mimeType)) {
    return {
      valid: false,
      error:
        messages.invalidType ||
        'Jenis file tidak diizinkan. Gunakan format yang didukung.',
      mimeType,
    };
  }

  if (verifyMagicBytes) {
    const detected = await detectFileType(buffer);
    const detectedMime = detected?.mime ?? null;

    if (!isMimeTypeCompatible(mimeType, detectedMime)) {
      return {
        valid: false,
        error:
          messages.invalidMagicBytes ||
          'Konten file tidak sesuai dengan jenis file yang diklaim',
        mimeType,
        detectedMimeType: detectedMime ?? undefined,
      };
    }
  }

  return { valid: true, mimeType, size: buffer.length };
}

export function assertValidFile(
  file: File,
  options: FileValidationOptions = {},
): void {
  const result = validateFile(file, options);
  if (!result.valid) {
    throw new BadRequestException(result.error || 'File tidak valid');
  }
}

export async function assertValidFileBuffer(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  options: FileValidationOptions = {},
): Promise<void> {
  const result = await validateFileBuffer(buffer, filename, mimeType, options);
  if (!result.valid) {
    throw new BadRequestException(result.error || 'File tidak valid');
  }
}
