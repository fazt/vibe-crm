import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { RealtimeService } from './realtime.service';

interface AuthenticatedSocket extends Socket {
  data: { userId?: string; workspaceId?: string };
}

@WebSocketGateway({
  namespace: '/ws',
  cors: {
    origin: process.env.WEB_URL ?? 'http://localhost:3000',
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private jwt: JwtService,
    private realtime: RealtimeService,
  ) {}

  afterInit(server: Server) {
    this.realtime.setServer(server);
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth?.token as string | undefined;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwt.verify<{ sub: string }>(token, {
        secret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-me-32chars',
      });

      client.data.userId = payload.sub;
      const workspaceId = client.handshake.auth?.workspaceId as string | undefined;
      if (workspaceId) {
        client.data.workspaceId = workspaceId;
        await client.join(`workspace:${workspaceId}`);
      }
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(_client: AuthenticatedSocket) {
    // noop
  }

  @SubscribeMessage('join-workspace')
  async handleJoinWorkspace(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { workspaceId: string },
  ) {
    if (!client.data.userId || !body?.workspaceId) return;
    if (client.data.workspaceId) {
      await client.leave(`workspace:${client.data.workspaceId}`);
    }
    client.data.workspaceId = body.workspaceId;
    await client.join(`workspace:${body.workspaceId}`);
    return { joined: body.workspaceId };
  }
}
