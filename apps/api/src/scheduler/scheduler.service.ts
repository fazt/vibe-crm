import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  EntityType,
  NotificationType,
  OpportunityStatus,
  TaskStatus,
} from '@vibe-crm/shared';
import { STALE_OPPORTUNITY_DAYS } from '@vibe-crm/shared';
import {
  opportunityStaleEmail,
  reminderDueEmail,
  sendEmail,
  taskOverdueDigestEmail,
} from '@vibe-crm/emails';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async processDueReminders() {
    const now = new Date();
    const due = await this.prisma.reminder.findMany({
      where: { sent: false, dueAt: { lte: now } },
      include: {
        assignee: { select: { id: true, email: true, firstName: true } },
        workspace: { select: { id: true, name: true } },
      },
      take: 100,
    });

    for (const reminder of due) {
      const userId = reminder.assigneeId;
      if (userId) {
        await this.prisma.notification.create({
          data: {
            workspaceId: reminder.workspaceId,
            userId,
            type: NotificationType.REMINDER,
            title: reminder.title,
            message: reminder.message,
            entityType: reminder.entityType ?? undefined,
            entityId: reminder.entityId ?? undefined,
          },
        });

        if (reminder.assignee?.email) {
          const html = reminderDueEmail(
            reminder.title,
            reminder.message ?? '',
            reminder.dueAt.toISOString(),
          );
          const sent = await sendEmail({
            to: reminder.assignee.email,
            subject: `Reminder: ${reminder.title}`,
            html,
          });
          if (sent) {
            await this.prisma.notification.updateMany({
              where: {
                workspaceId: reminder.workspaceId,
                userId,
                type: NotificationType.REMINDER,
                title: reminder.title,
                emailSent: false,
              },
              data: { emailSent: true },
            });
          }
        }
      }

      await this.prisma.reminder.update({
        where: { id: reminder.id },
        data: { sent: true },
      });
    }

    if (due.length > 0) {
      this.logger.log(`Processed ${due.length} due reminder(s)`);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async notifyOverdueTasks() {
    const now = new Date();
    const tasks = await this.prisma.task.findMany({
      where: {
        dueDate: { lt: now },
        status: { notIn: [TaskStatus.DONE, TaskStatus.CANCELLED] },
        assigneeId: { not: null },
      },
      include: {
        assignee: { select: { id: true, email: true, firstName: true } },
      },
    });

    const byUser = new Map<
      string,
      { user: NonNullable<(typeof tasks)[0]['assignee']>; tasks: typeof tasks }
    >();

    for (const task of tasks) {
      if (!task.assignee) continue;
      const entry = byUser.get(task.assignee.id) ?? {
        user: task.assignee,
        tasks: [],
      };
      entry.tasks.push(task);
      byUser.set(task.assignee.id, entry);
    }

    for (const [, { user, tasks: userTasks }] of byUser) {
      const alreadyNotified = await this.prisma.notification.findFirst({
        where: {
          userId: user.id,
          type: NotificationType.TASK_OVERDUE,
          createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
        },
      });
      if (alreadyNotified) continue;

      const workspaceId = userTasks[0].workspaceId;
      await this.prisma.notification.create({
        data: {
          workspaceId,
          userId: user.id,
          type: NotificationType.TASK_OVERDUE,
          title: `${userTasks.length} overdue task(s)`,
          message: userTasks.map((t) => t.title).join(', '),
          entityType: EntityType.TASK,
        },
      });

      if (user.email) {
        const html = taskOverdueDigestEmail(
          user.firstName,
          userTasks.map((t) => ({
            title: t.title,
            dueDate: t.dueDate?.toISOString() ?? 'no date',
          })),
        );
        await sendEmail({
          to: user.email,
          subject: `You have ${userTasks.length} overdue task(s)`,
          html,
        });
      }
    }

    if (tasks.length > 0) {
      this.logger.log(`Checked ${tasks.length} overdue task(s)`);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async notifyStaleOpportunities() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - STALE_OPPORTUNITY_DAYS);

    const opportunities = await this.prisma.opportunity.findMany({
      where: {
        status: OpportunityStatus.OPEN,
        OR: [
          { lastActivityAt: { lt: cutoff } },
          { lastActivityAt: null, updatedAt: { lt: cutoff } },
        ],
        assigneeId: { not: null },
      },
      include: {
        assignee: { select: { id: true, email: true, firstName: true } },
      },
    });

    const byUser = new Map<
      string,
      {
        user: NonNullable<(typeof opportunities)[0]['assignee']>;
        opps: typeof opportunities;
      }
    >();

    for (const opp of opportunities) {
      if (!opp.assignee) continue;
      const entry = byUser.get(opp.assignee.id) ?? {
        user: opp.assignee,
        opps: [],
      };
      entry.opps.push(opp);
      byUser.set(opp.assignee.id, entry);
    }

    const now = new Date();

    for (const [, { user, opps }] of byUser) {
      const alreadyNotified = await this.prisma.notification.findFirst({
        where: {
          userId: user.id,
          type: NotificationType.OPPORTUNITY_STALE,
          createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
        },
      });
      if (alreadyNotified) continue;

      const workspaceId = opps[0].workspaceId;
      await this.prisma.notification.create({
        data: {
          workspaceId,
          userId: user.id,
          type: NotificationType.OPPORTUNITY_STALE,
          title: `${opps.length} stale opportunit${opps.length === 1 ? 'y' : 'ies'}`,
          message: opps.map((o) => o.title).join(', '),
          entityType: EntityType.OPPORTUNITY,
        },
      });

      if (user.email) {
        const html = opportunityStaleEmail(
          user.firstName,
          opps.map((o) => {
            const ref = o.lastActivityAt ?? o.updatedAt;
            const days = Math.floor(
              (now.getTime() - ref.getTime()) / (24 * 60 * 60 * 1000),
            );
            return { title: o.title, days };
          }),
        );
        await sendEmail({
          to: user.email,
          subject: `${opps.length} opportunit${opps.length === 1 ? 'y needs' : 'ies need'} attention`,
          html,
        });
      }
    }

    if (opportunities.length > 0) {
      this.logger.log(`Checked ${opportunities.length} stale opportunit(ies)`);
    }
  }
}
