import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { DEFAULT_PIPELINE_STAGES } from '@vibe-crm/shared';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'demo@vibecrm.com' },
    update: {},
    create: {
      email: 'demo@vibecrm.com',
      passwordHash,
      firstName: 'Demo',
      lastName: 'User',
    },
  });

  const workspace = await prisma.workspace.upsert({
    where: { slug: 'demo-agency' },
    update: {},
    create: {
      name: 'Demo Agency',
      slug: 'demo-agency',
      members: {
        create: { userId: user.id, role: 'OWNER' },
      },
    },
  });

  const stages = [];
  for (const stage of DEFAULT_PIPELINE_STAGES) {
    const s = await prisma.pipelineStage.upsert({
      where: {
        workspaceId_name: { workspaceId: workspace.id, name: stage.name },
      },
      update: {},
      create: {
        workspaceId: workspace.id,
        name: stage.name,
        color: stage.color,
        order: stage.order,
        isWon: stage.isWon,
        isLost: stage.isLost,
      },
    });
    stages.push(s);
  }

  const company = await prisma.company.create({
    data: {
      workspaceId: workspace.id,
      name: 'Acme Corp',
      domain: 'acme.com',
      industry: 'Technology',
      size: '50-200',
      website: 'https://acme.com',
    },
  });

  const client = await prisma.client.create({
    data: {
      workspaceId: workspace.id,
      companyId: company.id,
      assigneeId: user.id,
      name: 'Acme Corp',
      email: 'contact@acme.com',
      status: 'ACTIVE',
      description: 'Key enterprise client',
    },
  });

  await prisma.contact.create({
    data: {
      workspaceId: workspace.id,
      clientId: client.id,
      companyId: company.id,
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@acme.com',
      jobTitle: 'VP Sales',
      isPrimary: true,
    },
  });

  const leadStage = stages.find((s) => s.name === 'Lead')!;
  const proposalStage = stages.find((s) => s.name === 'Proposal')!;

  await prisma.opportunity.createMany({
    data: [
      {
        workspaceId: workspace.id,
        stageId: leadStage.id,
        clientId: client.id,
        assigneeId: user.id,
        title: 'Website Redesign',
        value: 15000,
        probability: 30,
        order: 0,
      },
      {
        workspaceId: workspace.id,
        stageId: proposalStage.id,
        clientId: client.id,
        assigneeId: user.id,
        title: 'Annual Retainer',
        value: 48000,
        probability: 60,
        order: 0,
      },
    ],
  });

  await prisma.task.createMany({
    data: [
      {
        workspaceId: workspace.id,
        clientId: client.id,
        assigneeId: user.id,
        title: 'Send proposal draft',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      },
      {
        workspaceId: workspace.id,
        clientId: client.id,
        assigneeId: user.id,
        title: 'Follow up call',
        priority: 'MEDIUM',
        status: 'TODO',
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    ],
  });

  await prisma.note.create({
    data: {
      workspaceId: workspace.id,
      authorId: user.id,
      clientId: client.id,
      title: 'Kickoff notes',
      content: 'Client interested in full rebrand + website. Budget confirmed at $15k-$20k.',
    },
  });

  await prisma.activity.create({
    data: {
      workspaceId: workspace.id,
      authorId: user.id,
      clientId: client.id,
      type: 'CALL',
      title: 'Discovery call',
      duration: 45,
      outcome: 'Positive — moving to proposal',
    },
  });

  const tag = await prisma.tag.create({
    data: { workspaceId: workspace.id, name: 'Enterprise', color: '#6366f1' },
  });

  await prisma.tagAssignment.create({
    data: {
      workspaceId: workspace.id,
      tagId: tag.id,
      entityType: 'CLIENT',
      entityId: client.id,
    },
  });

  console.log('Seed complete:', { user: user.email, workspace: workspace.slug });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
