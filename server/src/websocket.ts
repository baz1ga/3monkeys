import type { FastifyBaseLogger } from 'fastify';
import { WebSocketServer, WebSocket } from 'ws';

type WsMeta = {
  tenantId: string | null;
  role: 'front' | 'gm';
  sessionId: string | null;
};

type PresenceApi = {
  updatePresence: (tenantId: string, sessionId: string, role: 'front' | 'gm', status: 'online' | 'offline') => void;
  getSessionState: (tenantId: string, sessionId: string) => { front: string; gm: string } | null;
  markOfflineIfStale: (hasOpenSocket: (tenantId: string, sessionId: string, role: 'front' | 'gm') => boolean) => void;
};

type InitParams = {
  server: any;
  logger?: FastifyBaseLogger;
};

export const initWebsocket = ({ server, logger }: InitParams) => {
  const log = logger || console;
  const wss = new WebSocketServer({ server, path: '/ws' });
  let presence: PresenceApi | null = null;
  let cleanupInterval: NodeJS.Timeout | null = null;
  let pingInterval: NodeJS.Timeout | null = null;

  const broadcastTenant = (tenantId: string, payload: Record<string, unknown>) => {
    const msg = JSON.stringify(payload);
    wss.clients.forEach(client => {
      const meta = (client as WebSocket & { meta?: WsMeta }).meta;
      if (client.readyState === WebSocket.OPEN && meta?.tenantId === tenantId) {
        client.send(msg);
      }
    });
  };

  const hasOpenSocket = (tenantId: string, sessionId: string, role: 'front' | 'gm') => {
    let found = false;
    wss.clients.forEach(client => {
      if (found) return;
      if (client.readyState !== WebSocket.OPEN) return;
      const meta = (client as WebSocket & { meta?: WsMeta }).meta;
      if (!meta) return;
      if (tenantId && meta.tenantId !== tenantId) return;
      if (role && meta.role !== role) return;
      if (sessionId && meta.sessionId !== sessionId) return;
      found = true;
    });
    return found;
  };

  const attachPresence = (presenceApi: PresenceApi) => {
    presence = presenceApi;
    if (cleanupInterval) clearInterval(cleanupInterval);
    cleanupInterval = setInterval(() => {
      presence?.markOfflineIfStale(hasOpenSocket);
    }, 5000);
    if (pingInterval) clearInterval(pingInterval);
    pingInterval = setInterval(() => {
      wss.clients.forEach(client => {
        const socket = client as WebSocket & { isAlive?: boolean };
        if (socket.isAlive === false) {
          socket.terminate();
          return;
        }
        socket.isAlive = false;
        socket.ping();
      });
    }, 15000);
  };

  wss.on('connection', (ws, req) => {
    (ws as WebSocket & { isAlive?: boolean }).isAlive = true;
    ws.on('pong', () => {
      (ws as WebSocket & { isAlive?: boolean }).isAlive = true;
    });
    let meta: WsMeta = { tenantId: null, role: 'front', sessionId: null };
    try {
      const urlObj = new URL(req.url || '', `http://${req.headers.host}`);
      meta = {
        tenantId: urlObj.searchParams.get('tenantId') || null,
        role: (urlObj.searchParams.get('role') as 'front' | 'gm') || 'front',
        sessionId: null
      };
    } catch {
      meta = { tenantId: null, role: 'front', sessionId: null };
    }
    (ws as WebSocket & { meta?: WsMeta }).meta = meta;

    const presenceApi = presence;
    if (!presenceApi) {
      log.warn?.('WebSocket connection without presence attached');
      return;
    }

    const counterpartOnline = (sessionId: string) => {
      if (!sessionId || !meta.tenantId) return false;
      const state = presenceApi.getSessionState(meta.tenantId, sessionId);
      if (!state) return false;
      if (meta.role === 'gm') return state.front === 'online';
      if (meta.role === 'front') return state.gm === 'online';
      return false;
    };

    ws.on('message', data => {
      let msg: any = null;
      try {
        msg = JSON.parse(data.toString());
      } catch {
        return;
      }
      if (!meta.tenantId) return;

      if (msg.type === 'presence:hello' && typeof msg.sessionId === 'string') {
        meta.sessionId = msg.sessionId;
        presenceApi.updatePresence(meta.tenantId, msg.sessionId, meta.role, 'online');
        return;
      }

      const sessionId = typeof msg.sessionId === 'string' ? msg.sessionId : null;
      if (msg.type === 'tension:update' && typeof msg.level === 'string') {
        if (sessionId && !counterpartOnline(sessionId)) return;
        const payload: Record<string, unknown> = { type: 'tension:update', level: msg.level };
        if (typeof msg.silent === 'boolean') payload.silent = msg.silent;
        if (sessionId) payload.sessionId = sessionId;
        broadcastTenant(meta.tenantId, payload);
      }
      if (msg.type === 'slideshow:update' && (typeof msg.index === 'number' || typeof msg.name === 'string')) {
        if (sessionId && !counterpartOnline(sessionId)) return;
        const payload: Record<string, unknown> = { type: 'slideshow:update' };
        if (typeof msg.index === 'number') payload.index = msg.index;
        if (typeof msg.name === 'string') payload.name = msg.name;
        if (sessionId) payload.sessionId = sessionId;
        broadcastTenant(meta.tenantId, payload);
      }
      if (msg.type === 'hourglass:command' && typeof msg.action === 'string') {
        if (sessionId && !counterpartOnline(sessionId)) return;
        const payload: Record<string, unknown> = { type: 'hourglass:command', action: msg.action };
        if (typeof msg.durationSeconds === 'number') payload.durationSeconds = msg.durationSeconds;
        if (typeof msg.visible === 'boolean') payload.visible = msg.visible;
        if (typeof msg.show === 'boolean') payload.show = msg.show;
        if (sessionId) payload.sessionId = sessionId;
        broadcastTenant(meta.tenantId, payload);
      }
      if (msg.type === 'tension:config' && msg.config && typeof msg.config === 'object') {
        const payload: Record<string, unknown> = { type: 'tension:config', config: msg.config };
        if (sessionId) payload.sessionId = sessionId;
        broadcastTenant(meta.tenantId, payload);
      }
      if (msg.type === 'tension:request' || msg.type === 'slideshow:request') {
        const payload: Record<string, unknown> = { type: msg.type };
        if (sessionId) payload.sessionId = sessionId;
        broadcastTenant(meta.tenantId, payload);
      }
    });

    ws.on('close', () => {
      if (meta.tenantId && meta.sessionId) {
        const stillConnected = hasOpenSocket(meta.tenantId, meta.sessionId, meta.role);
        if (!stillConnected) {
          presenceApi.updatePresence(meta.tenantId, meta.sessionId, meta.role, 'offline');
        }
      }
    });
  });

  return { wss, broadcastTenant, attachPresence };
};
