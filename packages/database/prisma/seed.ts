import { PrismaClient, RoleScope, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { DEFAULT_PIPELINE_STAGES, PlatformRoleSlug, WorkspaceRoleSlug } from '@vibe-crm/shared';
import { getRoleIdBySlug, seedRbac } from './seed-rbac';

const prisma = new PrismaClient();

async function main() {
  await seedRbac(prisma);

  const userRoleId = await getRoleIdBySlug(prisma, RoleScope.PLATFORM, PlatformRoleSlug.USER);
  const subscriberRoleId = await getRoleIdBySlug(prisma, RoleScope.PLATFORM, PlatformRoleSlug.SUBSCRIBER);
  const superadminRoleId = await getRoleIdBySlug(prisma, RoleScope.PLATFORM, PlatformRoleSlug.SUPERADMIN);
  const ownerRoleId = await getRoleIdBySlug(prisma, RoleScope.WORKSPACE, WorkspaceRoleSlug.OWNER);
  const workspaceAdminRoleId = await getRoleIdBySlug(prisma, RoleScope.WORKSPACE, WorkspaceRoleSlug.ADMIN);
  const workspaceMemberRoleId = await getRoleIdBySlug(prisma, RoleScope.WORKSPACE, WorkspaceRoleSlug.MEMBER);

  const superadminEmail = process.env.SUPERADMIN_EMAIL ?? 'admin@vibecrm.com';
  const passwordHash = await bcrypt.hash('password123', 10);

  const superadmin = await prisma.user.upsert({
    where: { email: superadminEmail },
    update: { roleId: superadminRoleId },
    create: {
      email: superadminEmail,
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      roleId: superadminRoleId,
      subscription: {
        create: { plan: SubscriptionPlan.AGENCY, status: SubscriptionStatus.ACTIVE },
      },
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'demo@vibecrm.com' },
    update: { roleId: subscriberRoleId },
    create: {
      email: 'demo@vibecrm.com',
      passwordHash,
      firstName: 'Demo',
      lastName: 'User',
      roleId: subscriberRoleId,
      subscription: {
        create: { plan: SubscriptionPlan.STUDIO, status: SubscriptionStatus.ACTIVE },
      },
    },
  });

  const workspace = await prisma.workspace.upsert({
    where: { slug: 'demo-agency' },
    update: {},
    create: {
      name: 'Demo Agency',
      slug: 'demo-agency',
      members: {
        create: { userId: user.id, roleId: ownerRoleId },
      },
    },
  });

  const existingMember = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId: user.id } },
  });
  if (!existingMember) {
    await prisma.workspaceMember.create({
      data: { workspaceId: workspace.id, userId: user.id, roleId: ownerRoleId },
    });
  }

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

  const existingCompany = await prisma.company.findFirst({
    where: { workspaceId: workspace.id, name: 'Acme Corp' },
  });
  const company =
    existingCompany ??
    (await prisma.company.create({
      data: {
        workspaceId: workspace.id,
        name: 'Acme Corp',
        domain: 'acme.com',
        industry: 'Technology',
        size: '50-200',
        website: 'https://acme.com',
      },
    }));

  const existingClient = await prisma.client.findFirst({
    where: { workspaceId: workspace.id, name: 'Acme Corp' },
  });
  const client =
    existingClient ??
    (await prisma.client.create({
      data: {
        workspaceId: workspace.id,
        companyId: company.id,
        assigneeId: user.id,
        name: 'Acme Corp',
        email: 'contact@acme.com',
        status: 'ACTIVE',
        description: 'Key enterprise client',
      },
    }));

  const existingContact = await prisma.contact.findFirst({
    where: { workspaceId: workspace.id, email: 'jane@acme.com' },
  });
  if (!existingContact) {
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
  }

  const leadStage = stages.find((s) => s.name === 'Lead')!;
  const proposalStage = stages.find((s) => s.name === 'Proposal')!;

  const oppCount = await prisma.opportunity.count({ where: { workspaceId: workspace.id } });
  if (oppCount === 0) {
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
  }

  const taskCount = await prisma.task.count({ where: { workspaceId: workspace.id } });
  if (taskCount === 0) {
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
  }

  const noteCount = await prisma.note.count({ where: { workspaceId: workspace.id, clientId: client.id } });
  if (noteCount === 0) {
    await prisma.note.create({
      data: {
        workspaceId: workspace.id,
        authorId: user.id,
        clientId: client.id,
        title: 'Kickoff notes',
        content: 'Client interested in full rebrand + website. Budget confirmed at $15k-$20k.',
      },
    });
  }

  const activityCount = await prisma.activity.count({ where: { workspaceId: workspace.id, clientId: client.id } });
  if (activityCount === 0) {
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
  }

  const existingTag = await prisma.tag.findUnique({
    where: { workspaceId_name: { workspaceId: workspace.id, name: 'Enterprise' } },
  });
  const tag =
    existingTag ??
    (await prisma.tag.create({
      data: { workspaceId: workspace.id, name: 'Enterprise', color: '#6366f1' },
    }));

  const existingAssignment = await prisma.tagAssignment.findFirst({
    where: { tagId: tag.id, entityType: 'CLIENT', entityId: client.id },
  });
  if (!existingAssignment) {
    await prisma.tagAssignment.create({
      data: {
        workspaceId: workspace.id,
        tagId: tag.id,
        entityType: 'CLIENT',
        entityId: client.id,
      },
    });
  }

  const freeUser = await prisma.user.upsert({
    where: { email: 'tset@test.com' },
    update: { roleId: userRoleId, passwordHash },
    create: {
      email: 'tset@test.com',
      passwordHash,
      firstName: 'Test',
      lastName: 'User',
      roleId: userRoleId,
      subscription: {
        create: { plan: SubscriptionPlan.SOLO, status: SubscriptionStatus.NONE },
      },
    },
  });

  const freeWorkspace = await prisma.workspace.upsert({
    where: { slug: 'mytestcompany' },
    update: {},
    create: {
      name: 'mytestcompany',
      slug: 'mytestcompany',
      pipelineStages: {
        create: DEFAULT_PIPELINE_STAGES.map((s) => ({
          name: s.name,
          color: s.color,
          order: s.order,
          isWon: s.isWon,
          isLost: s.isLost,
        })),
      },
    },
  });

  await prisma.workspaceMember.upsert({
    where: { workspaceId_userId: { workspaceId: freeWorkspace.id, userId: freeUser.id } },
    update: { roleId: ownerRoleId },
    create: { workspaceId: freeWorkspace.id, userId: freeUser.id, roleId: ownerRoleId },
  });

  const wsAdmin = await prisma.user.upsert({
    where: { email: 'wsadmin@vibecrm.com' },
    update: { roleId: userRoleId, passwordHash },
    create: {
      email: 'wsadmin@vibecrm.com',
      passwordHash,
      firstName: 'Workspace',
      lastName: 'Admin',
      roleId: userRoleId,
      subscription: {
        create: { plan: SubscriptionPlan.SOLO, status: SubscriptionStatus.NONE },
      },
    },
  });

  const wsMember = await prisma.user.upsert({
    where: { email: 'member@vibecrm.com' },
    update: { roleId: userRoleId, passwordHash },
    create: {
      email: 'member@vibecrm.com',
      passwordHash,
      firstName: 'Workspace',
      lastName: 'Member',
      roleId: userRoleId,
      subscription: {
        create: { plan: SubscriptionPlan.SOLO, status: SubscriptionStatus.NONE },
      },
    },
  });

  await prisma.workspaceMember.upsert({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId: wsAdmin.id } },
    update: { roleId: workspaceAdminRoleId },
    create: { workspaceId: workspace.id, userId: wsAdmin.id, roleId: workspaceAdminRoleId },
  });

  await prisma.workspaceMember.upsert({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId: wsMember.id } },
    update: { roleId: workspaceMemberRoleId },
    create: { workspaceId: workspace.id, userId: wsMember.id, roleId: workspaceMemberRoleId },
  });

  console.log('Seed complete:', {
    superadmin: superadmin.email,
    demo: user.email,
    freeUser: freeUser.email,
    wsAdmin: wsAdmin.email,
    wsMember: wsMember.email,
    workspace: workspace.slug,
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
