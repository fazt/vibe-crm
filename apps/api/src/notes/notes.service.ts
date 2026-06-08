import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paginate, skipTake } from '../common/pagination';
import type { CreateNoteInput, PaginationInput } from '@vibe-crm/validators';

export interface NoteListQuery extends PaginationInput {
  clientId?: string;
  contactId?: string;
  opportunityId?: string;
}

@Injectable()
export class NotesService {
  constructor(private prisma: PrismaService) {}

  private include = {
    author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    client: { select: { id: true, name: true } },
    contact: { select: { id: true, firstName: true, lastName: true } },
    opportunity: { select: { id: true, title: true } },
  };

  async list(workspaceId: string, query: NoteListQuery) {
    const where = {
      workspaceId,
      ...(query.clientId ? { clientId: query.clientId } : {}),
      ...(query.contactId ? { contactId: query.contactId } : {}),
      ...(query.opportunityId ? { opportunityId: query.opportunityId } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' as const } },
              { content: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const orderBy = query.sortBy
      ? { [query.sortBy]: query.sortOrder }
      : { createdAt: query.sortOrder };

    const [data, total] = await Promise.all([
      this.prisma.note.findMany({
        where,
        ...skipTake(query.page, query.limit),
        orderBy,
        include: this.include,
      }),
      this.prisma.note.count({ where }),
    ]);

    return paginate(data, total, query.page, query.limit);
  }

  async getOne(workspaceId: string, id: string) {
    const note = await this.prisma.note.findFirst({
      where: { id, workspaceId },
      include: this.include,
    });
    if (!note) throw new NotFoundException('Note not found');
    return note;
  }

  async create(workspaceId: string, authorId: string, data: CreateNoteInput) {
    return this.prisma.note.create({
      data: { ...data, workspaceId, authorId },
      include: this.include,
    });
  }

  async update(workspaceId: string, id: string, data: Partial<CreateNoteInput>) {
    await this.getOne(workspaceId, id);
    return this.prisma.note.update({
      where: { id },
      data,
      include: this.include,
    });
  }

  async remove(workspaceId: string, id: string) {
    await this.getOne(workspaceId, id);
    await this.prisma.note.delete({ where: { id } });
    return { deleted: true };
  }
}
