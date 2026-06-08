import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { RbacModule } from './rbac/rbac.module';
import { StorageModule } from './storage/storage.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { CompaniesModule } from './companies/companies.module';
import { ClientsModule } from './clients/clients.module';
import { ContactsModule } from './contacts/contacts.module';
import { OpportunitiesModule } from './opportunities/opportunities.module';
import { PipelineModule } from './pipeline/pipeline.module';
import { TasksModule } from './tasks/tasks.module';
import { NotesModule } from './notes/notes.module';
import { ActivitiesModule } from './activities/activities.module';
import { RemindersModule } from './reminders/reminders.module';
import { DocumentsModule } from './documents/documents.module';
import { TagsModule } from './tags/tags.module';
import { SearchModule } from './search/search.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { ContactFormModule } from './contact-form/contact-form.module';
import { BillingModule } from './billing/billing.module';
import { AdminModule } from './admin/admin.module';
import { RealtimeModule } from './realtime/realtime.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'] }),
    ScheduleModule.forRoot(),
    PrismaModule,
    RbacModule,
    StorageModule,
    AuthModule,
    UsersModule,
    WorkspacesModule,
    CompaniesModule,
    ClientsModule,
    ContactsModule,
    OpportunitiesModule,
    PipelineModule,
    TasksModule,
    NotesModule,
    ActivitiesModule,
    RemindersModule,
    DocumentsModule,
    TagsModule,
    SearchModule,
    NotificationsModule,
    DashboardModule,
    SchedulerModule,
    WebhooksModule,
    ContactFormModule,
    BillingModule,
    AdminModule,
    RealtimeModule,
  ],
})
export class AppModule {}
