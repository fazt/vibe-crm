import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PipelineService {
  constructor(private prisma: PrismaService) {}

  async listStages(workspaceId: string) {
    return this.prisma.pipelineStage.findMany({
      where: { workspaceId },
      orderBy: { order: 'asc' },
      include: {
        _count: { select: { opportunities: true } },
      },
    });
  }
}
