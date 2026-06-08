import { Controller, Get, Query } from '@nestjs/common';
import { z } from 'zod';
import { PERMISSIONS } from '@vibe-crm/shared';
import { SearchService } from './search.service';
import { RequirePermissions, WorkspaceId } from '../common/decorators';
import { ZodValidationPipe } from '../common/zod.pipe';

const searchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

@Controller('search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.SEARCH_USE)
  globalSearch(
    @WorkspaceId() workspaceId: string,
    @Query(new ZodValidationPipe(searchQuerySchema)) query: { q: string; limit: number },
  ) {
    return this.searchService.search(workspaceId, query.q, query.limit);
  }
}
