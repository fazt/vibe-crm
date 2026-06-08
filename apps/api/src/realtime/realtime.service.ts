import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

export const REALTIME_EVENTS = {
  OPPORTUNITY_CREATED: 'opportunity:created',
  OPPORTUNITY_UPDATED: 'opportunity:updated',
  OPPORTUNITY_STAGE_CHANGED: 'opportunity:stage_changed',
  OPPORTUNITY_DELETED: 'opportunity:deleted',
} as const;

@Injectable()
export class RealtimeService {
  private server: Server | null = null;

  setServer(server: Server) {
    this.server = server;
  }

  emitToWorkspace(workspaceId: string, event: string, payload: unknown) {
    this.server?.to(`workspace:${workspaceId}`).emit(event, payload);
  }
}
