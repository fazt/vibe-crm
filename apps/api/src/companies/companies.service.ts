import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paginate, skipTake } from '../common/pagination';
import type { CreateCompanyInput } from '@vibe-crm/validators';
import type { PaginationInput } from '@vibe-crm/validators';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async list(workspaceId: string, query: PaginationInput) {
    const where = {
      workspaceId,
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' as const } },
              { domain: { contains: query.search, mode: 'insensitive' as const } },
              { industry: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const orderBy = query.sortBy
      ? { [query.sortBy]: query.sortOrder }
      : { createdAt: query.sortOrder };

    const [data, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        ...skipTake(query.page, query.limit),
        orderBy,
      }),
      this.prisma.company.count({ where }),
    ]);

    return paginate(data, total, query.page, query.limit);
  }

  async getOne(workspaceId: string, id: string) {
    const company = await this.prisma.company.findFirst({
      where: { id, workspaceId },
      include: {
        _count: { select: { clients: true, contacts: true } },
      },
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async create(workspaceId: string, data: CreateCompanyInput) {
    return this.prisma.company.create({
      data: { ...data, workspaceId },
    });
  }

  async update(workspaceId: string, id: string, data: Partial<CreateCompanyInput>) {
    await this.getOne(workspaceId, id);
    return this.prisma.company.update({
      where: { id },
      data,
    });
  }

  async remove(workspaceId: string, id: string) {
    await this.getOne(workspaceId, id);
    await this.prisma.company.delete({ where: { id } });
    return { deleted: true };
  }
}
