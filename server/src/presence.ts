type PresenceStatus = 'online' | 'offline';

type SessionPresence = {
  front: PresenceStatus;
  gm: PresenceStatus;
  lastFrontPing?: number | null;
  lastGmPing?: number | null;
  createdAt?: number | null;
  updatedAt?: number | null;
};

type PresenceMap = Map<string, Map<string, SessionPresence>>;

type PresenceParams = {
  broadcastTenant?: (tenantId: string, payload: Record<string, unknown>) => void;
  presenceTtl?: number;
  onRunUpdate?: (tenantId: string, sessionId: string, patch: {
    front: PresenceStatus;
    gm: PresenceStatus;
    lastFrontPing: number | null;
    lastGmPing: number | null;
    updatedAt: number;
  }) => void;
};

export const createPresence = ({
  broadcastTenant,
  presenceTtl = 16000,
  onRunUpdate
}: PresenceParams) => {
  const presenceState: PresenceMap = new Map();

  const ensureState = (tenantId: string, sessionId: string) => {
    if (!presenceState.has(tenantId)) {
      presenceState.set(tenantId, new Map());
    }
    const sessions = presenceState.get(tenantId)!;
    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, {
        front: 'offline',
        gm: 'offline',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastFrontPing: null,
        lastGmPing: null
      });
    }
    return sessions.get(sessionId)!;
  };

  const getSessionState = (tenantId: string, sessionId: string) => {
    return presenceState.get(tenantId)?.get(sessionId) || null;
  };

  const updatePresence = (tenantId: string, sessionId: string, role: 'front' | 'gm', status: PresenceStatus) => {
    if (!tenantId || !sessionId) return;
    const state = ensureState(tenantId, sessionId);
    const now = Date.now();
    if (role === 'front') {
      state.front = status;
      state.lastFrontPing = now;
    } else {
      state.gm = status;
      state.lastGmPing = now;
    }
    state.updatedAt = now;
    broadcastTenant?.(tenantId, {
      type: 'presence:update',
      sessionId,
      front: state.front,
      gm: state.gm
    });
    onRunUpdate?.(tenantId, sessionId, {
      front: state.front,
      gm: state.gm,
      lastFrontPing: state.lastFrontPing || null,
      lastGmPing: state.lastGmPing || null,
      updatedAt: state.updatedAt || now
    });
  };

  const markOfflineIfStale = (hasOpenSocket: (tenantId: string, sessionId: string, role: 'front' | 'gm') => boolean) => {
    const now = Date.now();
    presenceState.forEach((sessions, tenantId) => {
      sessions.forEach((state, sessionId) => {
        const frontStale = state.front === 'online' && (!state.lastFrontPing || now - state.lastFrontPing > presenceTtl);
        const gmStale = state.gm === 'online' && (!state.lastGmPing || now - state.lastGmPing > presenceTtl);
        const hasFront = hasOpenSocket(tenantId, sessionId, 'front');
        const hasGm = hasOpenSocket(tenantId, sessionId, 'gm');

        let changed = false;
        if ((frontStale && !hasFront) || (state.front === 'online' && !hasFront)) {
          state.front = 'offline';
          changed = true;
        }
        if ((gmStale && !hasGm) || (state.gm === 'online' && !hasGm)) {
          state.gm = 'offline';
          changed = true;
        }
        if (changed) {
          state.updatedAt = now;
          broadcastTenant?.(tenantId, {
            type: 'presence:update',
            sessionId,
            front: state.front,
            gm: state.gm
          });
          onRunUpdate?.(tenantId, sessionId, {
            front: state.front,
            gm: state.gm,
            lastFrontPing: state.lastFrontPing || null,
            lastGmPing: state.lastGmPing || null,
            updatedAt: state.updatedAt || now
          });
        }
      });
    });
  };

  return {
    getSessionState,
    updatePresence,
    markOfflineIfStale,
    presenceState
  };
};
