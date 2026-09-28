import { DurableObject } from 'cloudflare:workers';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SECRET_KEY: string;
}

type ClientInfo = {
  userId: 'person_1' | 'person_2' | 'admin' | 'guest';
  role: 'user' | 'admin';
};

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...(init.headers || {}),
    },
  });
}

async function loadSession(env: Env, token: string): Promise<ClientInfo | null> {
  if (!token || !env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) return null;

  const base = env.SUPABASE_URL.replace(/\/$/, '');
  const url =
    `${base}/rest/v1/synax_sessions?token=eq.${encodeURIComponent(token)}` +
    `&select=token,user_id,active,ended_at&limit=1`;

  const headers: Record<string, string> = {
    apikey: env.SUPABASE_SECRET_KEY,
  };
  if (!env.SUPABASE_SECRET_KEY.startsWith('sb_')) {
    headers.Authorization = `Bearer ${env.SUPABASE_SECRET_KEY}`;
  }
  const res = await fetch(url, { headers });

  if (!res.ok) return null;

  const rows = await res.json() as Array<{
    token: string;
    user_id: 'person_1' | 'person_2' | 'admin';
    active: boolean;
    ended_at?: number | null;
  }>;

  const row = rows[0];
  if (!row || row.ended_at) return null;

  return {
    userId: row.user_id,
    role: row.user_id === 'admin' ? 'admin' : 'user',
  };
}

async function supabaseFetch(env: Env, path: string, init: RequestInit = {}) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) throw new Error('Supabase environment variables are missing.');
  const headers: Record<string, string> = {
    apikey: env.SUPABASE_SECRET_KEY,
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> || {}),
  };
  if (!env.SUPABASE_SECRET_KEY.startsWith('sb_')) headers.Authorization = `Bearer ${env.SUPABASE_SECRET_KEY}`;
  const res = await fetch(`${env.SUPABASE_URL.replace(/\/$/, '')}${path}`, { ...init, headers });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res;
}

export class SynaxRealtimeHub extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/broadcast' && request.method === 'POST') {
      const payload = await request.json().catch(() => null);
      if (!payload || typeof payload !== 'object') {
        return json({ error: 'Invalid broadcast payload' }, { status: 400 });
      }

      const message = JSON.stringify(payload);
      const sockets = this.ctx.getWebSockets();

      let recipientOnline = false;
      if (payload.type === 'chat:new_message' && payload.message?.senderId) {
        const senderId = payload.message.senderId as string;
        if (senderId === 'person_1' || senderId === 'person_2') {
          const recipientId = senderId === 'person_1' ? 'person_2' : 'person_1';
          recipientOnline = sockets.some((socket) => {
            const info = socket.deserializeAttachment() as ClientInfo | null;
            return info?.userId === recipientId;
          });
          if (recipientOnline && payload.message?.id) {
            this.ctx.waitUntil(this.markMessageDelivered(String(payload.message.id), senderId, recipientId));
          }
        }
      }

      for (const socket of sockets) {
        try {
          socket.send(message);
        } catch {
          try { socket.close(1011, 'Realtime delivery failed'); } catch {}
        }
      }

      return json({ ok: true, delivered: sockets.length, recipientOnline });
    }

    if (url.pathname !== '/ws') {
      return new Response('Not found', { status: 404 });
    }

    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 426 });
    }

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];

    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({
      userId: 'guest',
      role: 'user',
    } satisfies ClientInfo);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  private async markMessageDelivered(messageId: string, senderId: 'person_1' | 'person_2', recipientId: 'person_1' | 'person_2') {
    try {
      const res = await supabaseFetch(this.env,
        `/rest/v1/synax_messages?id=eq.${encodeURIComponent(messageId)}&status=eq.sent`,
        {
          method: 'PATCH',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify({ status: 'delivered' }),
        }
      );
      await res.arrayBuffer().catch(() => undefined);
      const payload = JSON.stringify({ type: 'chat:messages_delivered', recipientId, senderId, messageId });
      for (const socket of this.ctx.getWebSockets()) {
        try { socket.send(payload); } catch {}
      }
    } catch (error) {
      console.warn('SYNAX realtime message delivery update failed:', error);
    }
  }

  private async markPartnerMessagesDelivered(recipientId: 'person_1' | 'person_2') {
    const senderId = recipientId === 'person_1' ? 'person_2' : 'person_1';
    try {
      const res = await supabaseFetch(this.env,
        `/rest/v1/synax_messages?sender_id=eq.${senderId}&status=eq.sent`,
        {
          method: 'PATCH',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify({ status: 'delivered' }),
        }
      );
      await res.arrayBuffer().catch(() => undefined);
      const payload = JSON.stringify({ type: 'chat:messages_delivered', recipientId, senderId });
      for (const socket of this.ctx.getWebSockets()) {
        try { socket.send(payload); } catch {}
      }
    } catch (error) {
      console.warn('SYNAX realtime delivery reconciliation failed:', error);
    }
  }

  private async markPartnerMessagesRead(readerId: 'person_1' | 'person_2') {
    const senderId = readerId === 'person_1' ? 'person_2' : 'person_1';
    try {
      const res = await supabaseFetch(this.env,
        `/rest/v1/synax_messages?sender_id=eq.${senderId}&status=neq.read`,
        {
          method: 'PATCH',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify({ status: 'read' }),
        }
      );
      await res.arrayBuffer().catch(() => undefined);
      const payload = JSON.stringify({ type: 'chat:messages_read', readerId, senderId });
      for (const socket of this.ctx.getWebSockets()) {
        try { socket.send(payload); } catch {}
      }
    } catch (error) {
      console.warn('SYNAX realtime read reconciliation failed:', error);
    }
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    if (typeof message !== 'string') return;

    let data: any;
    try {
      data = JSON.parse(message);
    } catch {
      return;
    }

    if (data?.type === 'auth') {
      const session = await loadSession(this.env, String(data.token || ''));

      if (!session) {
        ws.send(JSON.stringify({
          type: 'auth:error',
          error: 'Invalid or expired session',
        }));
        try { ws.close(1008, 'Unauthorized'); } catch {}
        return;
      }

      ws.serializeAttachment(session);

      ws.send(JSON.stringify({
        type: 'auth:success',
        userId: session.userId,
        presence: {
          person_1: false,
          person_2: false,
          lastSeen_1: 0,
          lastSeen_2: 0,
        },
      }));

      if (session.userId === 'person_1' || session.userId === 'person_2') {
        this.ctx.waitUntil(this.markPartnerMessagesDelivered(session.userId));
      }

      return;
    }

    const info = (ws.deserializeAttachment() as ClientInfo | null) || {
      userId: 'guest',
      role: 'user',
    };

    if (data?.type === 'typing' &&
        (info.userId === 'person_1' || info.userId === 'person_2')) {
      const payload = JSON.stringify({
        type: 'typing:update',
        userId: info.userId,
        isTyping: !!data.isTyping,
      });

      for (const socket of this.ctx.getWebSockets()) {
        if (socket === ws) continue;
        try { socket.send(payload); } catch {}
      }
      return;
    }

    if (data?.type === 'chat:mark_read' &&
        (info.userId === 'person_1' || info.userId === 'person_2')) {
      this.ctx.waitUntil(this.markPartnerMessagesRead(info.userId));
      return;
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string) {
    try { ws.close(code, reason); } catch {}
  }

  async webSocketError(_ws: WebSocket, error: unknown) {
    console.error('SYNAX realtime WebSocket error:', error);
  }
}
