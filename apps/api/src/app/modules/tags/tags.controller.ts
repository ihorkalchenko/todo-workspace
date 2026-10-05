import {
  Body,
  Controller,
  Delete,
  Get,
  UseGuards,
  Request,
  Post,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';

@Controller('tags')
@UseGuards(JwtAuthGuard)
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  /**
   * Fetch all custom tags for the authenticated user
   *
   * @param req - Request object containing authenticated user info
   * @returns Array of Tag objects belonging to the user
   *
   * @example
   * GET /tags
   * Response: [
   *   { "id": 1, "name": "Bug", "color": "#EF4444", "userId": 42 },
   *   { "id": 2, "name": "Feature", "color": "#3B82F6", "userId": 42 }
   * ]
   */
  @Get()
  async getTags(@Request() req: any) {
    return this.tagsService.findAllForUser(req.user.id);
  }

  /**
   * Create a new custom tag for the authenticated user
   *
   * @param req - Request object containing authenticated user info
   * @param dto - Tag creation payload
   * @returns The newly created Tag object
   *
   * @example
   * POST /tags
   * Body: {
   *   "name": "Urgent",
   *   "color": "#F59E0B"
   * }
   * Response: {
   *   "id": 3,
   *   "name": "Urgent",
   *   "color": "#F59E0B",
   *   "userId": 42,
   *   "createdAt": "2026-09-30T16:00:00Z"
   * }
   */
  @Post()
  async createTag(@Request() req: any, @Body() dto: CreateTagDto) {
    return this.tagsService.create(req.user.id, dto);
  }

  /**
   * Delete a custom tag by ID
   *
   * @param req - Request object containing authenticated user info
   * @param id - The ID of the tag to delete
   * @returns Object indicating success status
   * @throws NotFoundException if tag with the given ID does not exist
   *
   * @example
   * DELETE /tags/3
   * Response: {
   *   "success": true
   * }
   */
  @Delete(':id')
  async deleteTag(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    await this.tagsService.delete(req.user.id, id);

    return{ success: true };
  }
}
