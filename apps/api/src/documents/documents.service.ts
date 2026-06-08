import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EntityType } from '@vibe-crm/shared';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { paginate, skipTake } from '../common/pagination';
import { confirmUploadSchema } from '@vibe-crm/validators';
import type { PaginationInput, PresignUploadInput } from '@vibe-crm/validators';
import type { z } from 'zod';

type ConfirmUploadInput = z.infer<typeof confirmUploadSchema>;

export interface DocumentListQuery extends PaginationInput {
  entityType?: EntityType;
  entityId?: string;
}

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  async list(workspaceId: string, query: DocumentListQuery) {
    const where = {
      workspaceId,
      ...(query.entityType ? { entityType: query.entityType } : {}),
      ...(query.entityId ? { entityId: query.entityId } : {}),
      ...(query.search
        ? { fileName: { contains: query.search, mode: 'insensitive' as const } }
        : {}),
    };

    const orderBy = query.sortBy
      ? { [query.sortBy]: query.sortOrder }
      : { createdAt: query.sortOrder };

    const [data, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        ...skipTake(query.page, query.limit),
        orderBy,
      }),
      this.prisma.document.count({ where }),
    ]);

    return paginate(data, total, query.page, query.limit);
  }

  async getOne(workspaceId: string, id: string) {
    const document = await this.prisma.document.findFirst({
      where: { id, workspaceId },
    });
    if (!document) throw new NotFoundException('Document not found');
    return document;
  }

  async presignUpload(workspaceId: string, data: PresignUploadInput) {
    this.storage.validateMimeType(data.mimeType);
    const key = this.storage.buildKey(
      workspaceId,
      data.entityType,
      data.entityId,
      data.fileName,
    );
    const { url } = await this.storage.getPresignedUploadUrl(key, data.mimeType);
    return { uploadUrl: url, key };
  }

  async confirmUpload(
    workspaceId: string,
    userId: string,
    data: ConfirmUploadInput,
  ) {
    if (!data.key.startsWith(`${workspaceId}/`)) {
      throw new BadRequestException('Invalid storage key for workspace');
    }

    const url = this.storage.getPublicUrl(data.key);
    const clientId = data.entityType === EntityType.CLIENT ? data.entityId : undefined;

    return this.prisma.document.create({
      data: {
        workspaceId,
        entityType: data.entityType,
        entityId: data.entityId,
        clientId,
        fileName: data.fileName,
        mimeType: data.mimeType,
        size: data.size,
        key: data.key,
        url,
        uploadedBy: userId,
      },
    });
  }

  async remove(workspaceId: string, id: string) {
    await this.getOne(workspaceId, id);
    await this.prisma.document.delete({ where: { id } });
    return { deleted: true };
  }
}
