export interface EmailSyncProvider {
  syncInbox(workspaceId: string, userId: string): Promise<void>;
  sendEmail(params: {
    to: string;
    subject: string;
    body: string;
    workspaceId: string;
  }): Promise<{ externalId: string }>;
}

export interface WhatsAppProvider {
  sendMessage(params: {
    to: string;
    message: string;
    workspaceId: string;
  }): Promise<{ externalId: string }>;
}

export interface ConversationSummaryProvider {
  summarize(params: {
    content: string;
    entityType: string;
    entityId: string;
  }): Promise<{ summary: string }>;
}

export class StubEmailSyncProvider implements EmailSyncProvider {
  async syncInbox(): Promise<void> {
    /* future integration */
  }
  async sendEmail(): Promise<{ externalId: string }> {
    return { externalId: 'stub-email' };
  }
}

export class StubWhatsAppProvider implements WhatsAppProvider {
  async sendMessage(): Promise<{ externalId: string }> {
    return { externalId: 'stub-whatsapp' };
  }
}

export class StubConversationSummaryProvider implements ConversationSummaryProvider {
  async summarize(): Promise<{ summary: string }> {
    return { summary: '' };
  }
}
