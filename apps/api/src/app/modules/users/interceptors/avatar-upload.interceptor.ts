import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { mkdirSync } from 'fs';

import { AVATAR_MAX_SIZE } from '@todo-workspace/constants';

export interface RequestWithUser extends Request {
  user?: {
    id: number;
    name?: string;
    email?: string;
  };
}

export type FilenameCallback = (error: Error | null, filename: string) => void;
export type FileFilterCallback = (error: Error | null, acceptFile: boolean) => void;
export type DestinationCallback = (error: Error | null, destination: string) => void;

export const avatarDestinationHandler = (
  req: Request,
  file: Express.Multer.File,
  callback: DestinationCallback,
): void => {
  const uploadPath = './uploads/avatars';
  mkdirSync(uploadPath, { recursive: true });
  callback(null, uploadPath);
};

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
    destination: avatarDestinationHandler,
    filename: avatarFilenameHandler,
  }),
  limits: { fileSize: AVATAR_MAX_SIZE },
  fileFilter: avatarFileFilterHandler,
};

export const AvatarUploadInterceptor = FileInterceptor(
  'file',
  avatarUploadOptions,
);
