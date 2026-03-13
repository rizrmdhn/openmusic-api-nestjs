import {
  FileValidator,
  PayloadTooLargeException,
  UnprocessableEntityException,
} from '@nestjs/common';

export class ImageSizeValidator extends FileValidator {
  constructor(private readonly maxSize: number) {
    super({});
  }

  isValid(file: Express.Multer.File): boolean {
    if (file.size > this.maxSize) {
      throw new PayloadTooLargeException(
        `File size must not exceed ${this.maxSize / (1024 * 1024)}MB`,
      );
    }
    return true;
  }

  buildErrorMessage(): string {
    return `File too large`;
  }
}

export class ImageTypeValidator extends FileValidator {
  private readonly allowed: RegExp;

  constructor(mimePattern: RegExp = /image\/(jpeg|png)/) {
    super({});
    this.allowed = mimePattern;
  }

  isValid(file: Express.Multer.File): boolean {
    if (!this.allowed.test(file.mimetype)) {
      throw new UnprocessableEntityException(
        `File type not allowed. Allowed types: ${this.allowed.source}`,
      );
    }
    return true;
  }

  buildErrorMessage(): string {
    return `Invalid file type`;
  }
}
