import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

export interface RequestWithUser extends Request {
  user?: {
    id: number;
  };
}

export type FilenameCallback = (error: Error | null, filename: string) => void;
export type FileFilterCallback = (error: Error | null, acceptFile: boolean) => void;

export const avatarFilenameHandler = (
  req: RequestWithUser,
  file: Express.Multer.File,
  callback: FilenameCallback,
): void => {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const ext = extname(file.originalname);
  const userId = req.user?.id ?? 'unknown';

  callback(null, `avatar-${userId}-${uniqueSuffix}${ext}`);
};

export const avatarFileFilterHandler = (
  req: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback,
): void => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
    return callback(new BadRequestException('Only image files (jpg, jpeg, png, webp) are allowed!'), false);
  }
  return callback(null, true);
};

export const avatarUploadOptions: MulterOptions = {
  storage: diskStorage({
    destination: './uploads/avatars',
    filename: avatarFilenameHandler,
  }),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: avatarFileFilterHandler,
};

export const AvatarUploadInterceptor = FileInterceptor(
  'file',
  avatarUploadOptions,
);
