export { StorageService } from './storage.service.js';
export {
  ImageSizeValidator,
  ImageTypeValidator,
} from './file.validators.js';
export { StorageModule } from './storage.module.js';
export type { UploadOptions, UploadResult } from './types.js';
export { StorageError, UploadFailedError, FileNotFoundError } from './types.js';

export {
  processAndUploadImage,
  processAndUploadImageIfPresent,
  processAndUploadImages,
  processAndUploadFile,
  processAndUploadFileIfPresent,
} from './upload.helper.js';
export type {
  ProcessAndUploadImageOptions,
  ProcessAndUploadFileOptions,
  ImageConversionOptions,
} from './upload.helper.js';

export {
  FILE_SIZE_LIMITS,
  ALLOWED_MIME_TYPES,
  validateFile,
  validateFileBuffer,
  assertValidFile,
  assertValidFileBuffer,
} from './file-validator.js';
export type {
  FileValidationOptions,
  FileValidationResult,
} from './file-validator.js';
