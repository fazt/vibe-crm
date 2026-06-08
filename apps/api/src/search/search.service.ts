import { Injectable } from '@nestjs/common';
import type { SearchResult } from '@vibe-crm/shared';
import { OpportunityStatus, TaskStatus } from '@vibe-crm/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async search(workspaceId: string, term: string, limit = 10): Promise<SearchResult[]> {
    const q = term.trim();
    if (!q) return [];

    const perType = Math.max(2, Math.ceil(limit / 4));
    const contains = { contains: q, mode: 'insensitive' as const };

    const [clients, contacts, opportunities, tasks] = await Promise.all([
      this.prisma.client.findMany({
        where: {
          workspaceId,
          OR: [{ name: contains }, { email: contains }],
        },
        take: perType,
        select: { id: true, name: true, email: true },
      }),
      this.prisma.contact.findMany({
        where: {
          workspaceId,
          OR: [
            { firstName: contains },
            { lastName: contains },
            { email: contains },
          ],
        },
        take: perType,
        select: { id: true, firstName: true, lastName: true, email: true },
      }),
      this.prisma.opportunity.findMany({
        where: {
          workspaceId,
          status: OpportunityStatus.OPEN,
          title: contains,
        },
        take: perType,
        select: { id: true, title: true, value: true },
      }),
      this.prisma.task.findMany({
        where: {
          workspaceId,
          status: { not: TaskStatus.CANCELLED },
          OR: [{ title: contains }, { description: contains }],
        },
        take: perType,
        select: { id: true, title: true, status: true },
      }),
    ]);

    const results: SearchResult[] = [
      ...clients.map((c) => ({
        type: 'client',
        id: c.id,
        title: c.name,
        subtitle: c.email ?? undefined,
        url: `/clients/${c.id}`,
      })),
      ...contacts.map((c) => ({
        type: 'contact',
        id: c.id,
        title: `${c.firstName} ${c.lastName}`,
        subtitle: c.email ?? undefined,
        url: `/contacts/${c.id}`,
      })),
      ...opportunities.map((o) => ({
        type: 'opportunity',
        id: o.id,
        title: o.title,
        subtitle: o.value > 0 ? `$${o.value.toLocaleString()}` : undefined,
        url: `/opportunities?id=${o.id}`,
      })),
      ...tasks.map((t) => ({
        type: 'task',
        id: t.id,
        title: t.title,
        subtitle: t.status,
        url: `/tasks/${t.id}`,
      })),
    ];

    return results.slice(0, limit);
  }
}
