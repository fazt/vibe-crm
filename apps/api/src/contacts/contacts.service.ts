import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlanLimitsService } from '../rbac/plan-limits.service';
import { paginate, skipTake } from '../common/pagination';
import type { CreateContactInput, PaginationInput } from '@vibe-crm/validators';

export interface ContactListQuery extends PaginationInput {
  clientId?: string;
  companyId?: string;
}

@Injectable()
export class ContactsService {
  constructor(
    private prisma: PrismaService,
    private planLimits: PlanLimitsService,
  ) {}

  private include = {
    client: { select: { id: true, name: true } },
    company: { select: { id: true, name: true } },
  };

  async list(workspaceId: string, query: ContactListQuery) {
    const where = {
      workspaceId,
      ...(query.clientId ? { clientId: query.clientId } : {}),
      ...(query.companyId ? { companyId: query.companyId } : {}),
      ...(query.search
        ? {
            OR: [
              { firstName: { contains: query.search, mode: 'insensitive' as const } },
              { lastName: { contains: query.search, mode: 'insensitive' as const } },
              { email: { contains: query.search, mode: 'insensitive' as const } },
              { phone: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const orderBy = query.sortBy
      ? { [query.sortBy]: query.sortOrder }
      : { createdAt: query.sortOrder };

    const [data, total] = await Promise.all([
      this.prisma.contact.findMany({
        where,
        ...skipTake(query.page, query.limit),
        orderBy,
        include: this.include,
      }),
      this.prisma.contact.count({ where }),
    ]);

    return paginate(data, total, query.page, query.limit);
  }

  async getOne(workspaceId: string, id: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, workspaceId },
      include: this.include,
    });
    if (!contact) throw new NotFoundException('Contact not found');
    return contact;
  }

  async create(workspaceId: string, userId: string, data: CreateContactInput) {
    const count = await this.prisma.contact.count({ where: { workspaceId } });
    await this.planLimits.assertCanCreate(userId, workspaceId, 'contacts', count);
    return this.prisma.contact.create({
      data: { ...data, workspaceId },
      include: this.include,
    });
  }

  async update(workspaceId: string, id: string, data: Partial<CreateContactInput>) {
    await this.getOne(workspaceId, id);
    return this.prisma.contact.update({
      where: { id },
      data,
      include: this.include,
    });
  }

  async remove(workspaceId: string, id: string) {
    await this.getOne(workspaceId, id);
    await this.prisma.contact.delete({ where: { id } });
    return { deleted: true };
  }
}
