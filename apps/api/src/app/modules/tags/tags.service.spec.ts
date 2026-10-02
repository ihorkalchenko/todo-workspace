import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DRIZZLE } from '../../db/db.module';
import { and, eq } from 'drizzle-orm';
import * as schema from '../../db/schemas';

import { Tag} from '@todo-workspace/tasks';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';

describe('TagsService', () => {
  let service: TagsService;

  const mockUserId = 42;
  const mockTags: Tag[] = [
    {
      id: 1,
      name: 'Bug',
      color: '#EF4444',
      userId: mockUserId,
    },
    {
      id: 2,
      name: 'Feature',
      color: '#3B82F6',
      userId: mockUserId,
    },
  ];

  const mockDeleteWhere = vi.fn().mockResolvedValue({ rowCount: 1 });
  const mockDelete = vi.fn().mockReturnValue({ where:mockDeleteWhere });
  const mockInsertValues = vi.fn();
  const mockInsert = vi.fn().mockReturnValue({ values: mockInsertValues });

  const mockDB = {
    query: {
      tags: {
        findMany: vi.fn(),
      },
    },
    insert: mockInsert,
    delete: mockDelete,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagsService,
        {
          provide: DRIZZLE,
          useValue: mockDB,
        },
      ],
    }).compile();

    service = module.get<TagsService>(TagsService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllForUser', () => {
    it('should return all tags belonging to the given user ID', async () => {
      mockDB.query.tags.findMany.mockResolvedValue(mockTags);

      const result = await service.findAllForUser(mockUserId);

      expect(result).toEqual(mockTags);
      expect(mockDB.query.tags.findMany).toHaveBeenCalledWith({
        where: eq(schema.tags.userId, mockUserId),
      });
    });
  });

  describe('create', () => {
    it('should create and return a new tag', async () => {
      const createDto: CreateTagDto = {
        name: 'Urgent',
        color: '#F59E0B'
      };

      const createdTag: Tag = {
        id: 3,
        ...createDto,
        userId: mockUserId,
      };

      const mockReturning = vi.fn().mockResolvedValue([createdTag]);
      mockInsertValues.mockReturnValue({ returning: mockReturning });

      const result = await service.create(mockUserId, createDto);

      expect(result).toEqual(createdTag);
      expect(mockInsert).toHaveBeenCalledWith(schema.tags);
      expect(mockInsertValues).toHaveBeenCalledWith({
        name: createDto.name,
        color: createDto.color,
        userId: mockUserId,
      });
    });
  });

  describe('delete', () => {
    it('should delete a tag if it exists and belongs to the user', async () => {
      const tagId = 1;

      mockDeleteWhere.mockResolvedValue({  rowCount: 1 });

      const result = await service.delete(mockUserId, tagId);

      expect(result).toBe(true);
      expect(mockDelete).toHaveBeenCalledWith(schema.tags);
      expect(mockDeleteWhere).toHaveBeenCalledWith(
        and(
          eq(schema.tags.id, tagId),
          eq(schema.tags.userId, mockUserId),
        ),
      );
    });

    it('should throw NotFoundException if tag does not exist or belong to user', async () => {
      const tagId = 999;

      mockDeleteWhere.mockResolvedValue({ rowCount: 0 });

      await expect(service.delete(mockUserId, tagId)).rejects.toThrow(NotFoundException);
    });
  });
});
