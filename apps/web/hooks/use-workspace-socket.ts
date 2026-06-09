'use client';

import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { getAuthTokens } from '@/lib/auth-tokens';
import { getWorkspaceId } from '@/lib/workspace-id';

const WS_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api').replace(/\/api$/, '');

export function useWorkspaceSocket(
  events: Record<string, (payload: unknown) => void>,
  enabled = true,
) {
  const socketRef = useRef<Socket | null>(null);
  const eventsRef = useRef(events);
  eventsRef.current = events;

  useEffect(() => {
    if (!enabled) return;

    const tokens = getAuthTokens();
    const workspaceId = getWorkspaceId();
    if (!tokens?.accessToken || !workspaceId) return;

    const socket = io(`${WS_BASE}/ws`, {
      auth: { token: tokens.accessToken, workspaceId },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-workspace', { workspaceId });
    });

    for (const [event, handler] of Object.entries(eventsRef.current)) {
      socket.on(event, handler);
    }

    return () => {
      for (const event of Object.keys(eventsRef.current)) {
        socket.off(event);
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled]);

  return socketRef;
}

export const OPPORTUNITY_EVENTS = {
  CREATED: 'opportunity:created',
  UPDATED: 'opportunity:updated',
  STAGE_CHANGED: 'opportunity:stage_changed',
  DELETED: 'opportunity:deleted',
} as const;
