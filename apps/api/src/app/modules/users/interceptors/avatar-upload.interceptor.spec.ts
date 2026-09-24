import { describe, expect, it, vi} from 'vitest';
import { Request } from 'express';
import { BadRequestException } from '@nestjs/common';

import {
  AvatarUploadInterceptor,
  RequestWithUser,
  avatarFileFilterHandler,
  avatarFilenameHandler,
  avatarDestinationHandler,
} from './avatar-upload.interceptor';

describe('AvatarUploadInterceptor', () => {
  it('should be defined', () => {
    expect(AvatarUploadInterceptor).toBeDefined();
  });

  describe('avatarFileFilterHandler', () => {
    it('should accept valid image mime types (png, jpg, jpeg, webp)', () => {
      const callback = vi.fn();
      const validMimetypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp'];

      validMimetypes.forEach(mimetype => {
        avatarFileFilterHandler(
          {} as Request,
          { mimetype } as Express.Multer.File,
          callback,
        );
        expect(callback).toHaveBeenCalledWith(null, true);
        callback.mockClear();
      });
    });

    it('should reject non-image file types with BadRequestException', () => {
      const callback = vi.fn();
      const invalidMimetypes = ['application/pdf', 'text/plain', 'image/gif'];

      invalidMimetypes.forEach(mimetype => {
        avatarFileFilterHandler(
          {} as Request,
          { mimetype } as Express.Multer.File,
          callback,
        );
        expect(callback).toHaveBeenCalledWith(
          expect.any(BadRequestException),
          false
        );
        callback.mockClear();
      });
    });
  });

  describe('avatarDestinationHandler', () => {
    it('should call callback with uploads/avatars path', () => {
      const callback = vi.fn();

      avatarDestinationHandler(
        {} as Request,
        {} as Express.Multer.File,
        callback,
      );

      expect(callback).toHaveBeenCalledWith(null, './uploads/avatars');
    });
  });

  describe('avatarFileNameHandler', () => {
    it('should generate formatted avatar filename with userId', () => {
      const callback = vi.fn();
      const mockRequest: RequestWithUser = { user: { id: 42 } } as RequestWithUser;
      const mockFile: Express.Multer.File = { originalname: 'profile-pic.png' } as Express.Multer.File;

      avatarFilenameHandler(mockRequest, mockFile, callback);

      expect(callback).toHaveBeenCalledWith(
        null,
        expect.stringMatching(/^avatar-42-\d+-\d+\.png$/)
      );
    });

    it('should fallback to "unknown" if user is undefined in request', () => {
      const callback = vi.fn();
      const mockRequest: RequestWithUser = {} as RequestWithUser;
      const mockFile: Express.Multer.File = { originalname: 'avatar.jpeg' } as Express.Multer.File;

      avatarFilenameHandler(mockRequest, mockFile, callback);

      expect(callback).toHaveBeenCalledWith(
        null,
        expect.stringMatching(/^avatar-unknown-\d+-\d+\.jpeg$/)
      );
    });
  });
});
