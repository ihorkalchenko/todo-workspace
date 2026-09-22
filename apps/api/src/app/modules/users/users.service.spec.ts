import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DRIZZLE } from '../../db/db.module';
import * as bcrypt from 'bcrypt';

import { UsersService } from './users.service';
import { User } from '@todo-workspace/users';

const {mockGenSalt, mockHash } = vi.hoisted(() => ({
  mockGenSalt: vi.fn().mockResolvedValue('$2b$10$mockSalt'),
  mockHash: vi.fn().mockResolvedValue('$2b$10$hashedPassword'),
}));

vi.mock('bcrypt', () => ({
  default: {
    genSalt: mockGenSalt,
    hash: mockHash,
  },
  genSalt: mockGenSalt,
  hash: mockHash,
}));

describe('UsersService', () => {
  let service: UsersService;

  const mockWhere = vi.fn();
  const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
  const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

  const mockReturning = vi.fn();
  const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
  const mockInsert = vi.fn().mockReturnValue({ values: mockValues });
  const mockUpdate = vi.fn().mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({ returning: mockReturning }),
    }),
  });

  const mockDB = {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: DRIZZLE,
          useValue: mockDB,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should  be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUsers', () => {
    const mockUsers: User[] = [
      { id: 1, name: 'Alice', email: 'alice@test.com', avatar: null },
      { id: 2, name: 'Bob', email: 'bob@test.com', avatar: '/uploads/avatars/bob.png' },
    ];

    it('should return all users when no search query is provided', async () => {
      mockWhere.mockResolvedValue(mockUsers);

      const result = await service.getUsers();

      expect(result).toEqual(mockUsers);
      expect(mockSelect).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalled();
    });

    it('should filter users by search term when search query is provided', async () => {
      const filteredUsers = [mockUsers[0]];
      mockWhere.mockResolvedValue(filteredUsers);

      const result = await service.getUsers('Alice');

      expect(result).toEqual(filteredUsers);
    });
  });

  describe('getUser', () => {
    const mockUser: User = { id: 1, name: 'Alice', email: 'alice@test.com', avatar: null };

    it('should return user by ID if found', async () => {
      mockWhere.mockResolvedValue([mockUser]);

      const result = await service.getUser(1);

      expect(result).toEqual(mockUser);
    });

    it('should return undefined if user is not found', async () => {
      mockWhere.mockResolvedValue([]);

      const result = await service.getUser(999);

      expect(result).toBeUndefined();
    });
  });

  describe('findByEmail', () => {
    const mockUserWithPassword = {
      id: 1,
      name: 'Alice',
      email: 'alice@example.com',
      password: '$2b$10$hashedpassword',
      avatar: null,
    };

    it('should return user with password field by email', async () => {
      mockWhere.mockResolvedValue([mockUserWithPassword]);

      const result = await service.findByEmail('alice@example.com');

      expect(result).toEqual(mockUserWithPassword);
    });

    it('should return undefined if email is not found', async () => {
      mockWhere.mockResolvedValue([]);

      const result = await service.findByEmail('non-email@test.com');

      expect(result).toBeUndefined();
    });
  });

  describe('createUser', () => {
    const newUserData = {
      name: 'Charlie',
      email: 'charlie@example.com',
      password: 'plainPassword123',
    };

    const createdUser: User = {
      id: 3,
      name: 'Charlie',
      email: 'charlie@example.com',
      avatar: null,
    };

    it('should hash password and return created user without password', async () => {
      mockReturning.mockResolvedValue([createdUser]);

      const result = await service.createUser(newUserData);

      expect(mockGenSalt).toHaveBeenCalledWith(10);
      expect(mockHash).toHaveBeenCalledWith('plainPassword123', '$2b$10$mockSalt');
      expect(mockInsert).toHaveBeenCalled();
      expect(result).toEqual(createdUser);
    });
  });

  describe('updateUser', () => {
    const existingUser = {
      id: 1,
      name: 'Alice',
      email: 'alice@example.com',
      password: '$2b$10$hashedpassword',
      avatar: null,
    };

    const updatedUser: User = {
      id: 1,
      name: 'Alice Updated',
      email: 'alice@example.com',
      avatar: '/uploads/avatars/avatar-1.png',
    };

    it('should updaet user successfully when email is unchanged or available', async () => {
      mockReturning.mockResolvedValue([updatedUser]);

      const result = await service.updateUser(1, { name: 'Alice Updated' });

      expect(result).toEqual(updatedUser);
    });

    it('should throw ConflictException if new email belongs to another user', async () => {
      const otherUser = {
        id: 2,
        name: 'Bob',
        email: 'taken@example.com',
        password: 'hash',
        avatar: null,
      };

      mockWhere.mockResolvedValue([otherUser]);

      await expect(service.updateUser(1, { email: 'taken@example.com' })).rejects.toThrow(ConflictException);
    });

    it('should allow updating email if email matches current user id', async () => {
      mockWhere.mockResolvedValueOnce([existingUser]);
      mockReturning.mockResolvedValue([updatedUser]);

      const result = await service.updateUser(1, { email: 'alice@example.com' });

      expect(result).toEqual(updatedUser);
    });
  });
});
