// @ts-nocheck
import Fastify, { FastifyReply, FastifyRequest } from 'fastify';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import session from '@fastify/session';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import fs from 'fs';
import { pipeline } from 'stream/promises';
import sharp from 'sharp';
import { ensureDir, uniqueFilename, sanitizeName } from './utils.js';
import { initWebsocket } from './websocket.js';
import { createPresence } from './presence.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDistDir = path.resolve(__dirname, '..', '..', 'client', 'dist');
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

const prisma = new PrismaClient();
const app = Fastify({ logger: true });

const isProd = process.env.NODE_ENV === 'production';
const sessionSecret = process.env.SESSION_SECRET || 'dev-session-secret';

const { broadcastTenant, attachPresence } = initWebsocket({ server: app.server, logger: app.log });
const minRunDurationMs = 2 * 60 * 1000;

const toDate = (value?: number | null) => (value ? new Date(value) : null);
const toMillis = (value?: Date | null) => (value ? value.getTime() : null);

const getLastRun = async (tenantId: string, sessionId: string) => {
  return prisma.sessionRunState.findFirst({
    where: { tenantId, sessionId },
    orderBy: { createdAt: 'desc' }
  });
};

const appendSessionRun = async (
  tenantId: string,
  sessionId: string,
  data: { front?: string; gm?: string; lastFrontPing?: number | null; lastGmPing?: number | null; createdAt?: number; updatedAt?: number }
) => {
  return prisma.sessionRunState.create({
    data: {
      tenantId,
      sessionId,
      front: data.front || 'offline',
      gm: data.gm || 'offline',
      lastFrontPing: toDate(data.lastFrontPing ?? null),
      lastGmPing: toDate(data.lastGmPing ?? null),
      createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined
    }
  });
};

const updateLatestRun = async (
  tenantId: string,
  sessionId: string,
  patch: { front: string; gm: string; lastFrontPing: number | null; lastGmPing: number | null; updatedAt: number }
) => {
  const run = await getLastRun(tenantId, sessionId);
  if (!run) return null;
  const updatedAt = patch.updatedAt ? new Date(patch.updatedAt) : new Date();
  const updated = await prisma.sessionRunState.update({
    where: { id: run.id },
    data: {
      front: patch.front,
      gm: patch.gm,
      lastFrontPing: toDate(patch.lastFrontPing),
      lastGmPing: toDate(patch.lastGmPing),
      updatedAt
    }
  });
  if (updated.front === 'offline' && updated.gm === 'offline') {
    const duration = updated.updatedAt.getTime() - updated.createdAt.getTime();
    if (duration < minRunDurationMs) {
      await prisma.sessionRunState.delete({ where: { id: updated.id } });
      return null;
    }
  }
  return updated;
};

const getRunStatesGrouped = async () => {
  const runs = await prisma.sessionRunState.findMany({
    orderBy: { createdAt: 'desc' }
  });
  const tmap = new Map<string, { tenantId: string; sessions: { sessionId: string; runs: any[] }[] }>();
  runs.forEach(run => {
    if (!tmap.has(run.tenantId)) tmap.set(run.tenantId, { tenantId: run.tenantId, sessions: [] });
    const tenant = tmap.get(run.tenantId)!;
    let session = tenant.sessions.find(s => s.sessionId === run.sessionId);
    if (!session) {
      session = { sessionId: run.sessionId, runs: [] };
      tenant.sessions.push(session);
    }
    session.runs.push({
      front: run.front,
      gm: run.gm,
      lastFrontPing: toMillis(run.lastFrontPing),
      lastGmPing: toMillis(run.lastGmPing),
      createdAt: run.createdAt.getTime(),
      updatedAt: run.updatedAt.getTime()
    });
  });
  return Array.from(tmap.values());
};

const presence = createPresence({
  broadcastTenant,
  onRunUpdate: (tenantId, sessionId, patch) => {
    void updateLatestRun(tenantId, sessionId, patch);
  }
});
attachPresence(presence);

await app.register(cors, {
  origin: true,
  credentials: true
});

await app.register(cookie);
await app.register(session, {
  secret: sessionSecret,
  cookieName: 'sid',
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd
  }
});

const uploadsDir = path.resolve(__dirname, '..', 'uploads');
ensureDir(uploadsDir);

const getTenantUploadDir = (tenantId: string) => {
  const dir = path.join(uploadsDir, tenantId);
  ensureDir(dir);
  return dir;
};

async function generateThumbnail(sourcePath: string, filename: string, targetDir: string) {
  const name = path.parse(filename).name;
  const thumbName = `thumb-${name}.jpg`;
  const thumbPath = path.join(targetDir, thumbName);
  await sharp(sourcePath)
    .resize(320, 320, { fit: 'cover' })
    .jpeg({ quality: 80 })
    .toFile(thumbPath);
  return { thumbName, thumbPath };
}
await app.register(fastifyStatic, {
  root: uploadsDir,
  prefix: '/uploads/',
  decorateReply: false
});
await app.register(fastifyStatic, {
  root: clientDistDir,
  prefix: '/'
});

await app.register(multipart, {
  limits: { fileSize: 40 * 1024 * 1024 }
});

const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const MAX_AUDIO_BYTES = 40 * 1024 * 1024;
const TENSION_DEFAULTS = {
  enabled: true,
  colors: {
    level1: '#37aa32',
    level2: '#f8d718',
    level3: '#f39100',
    level4: '#e63027',
    level5: '#3a3a39'
  },
  labels: {
    level1: '0',
    level2: '-5',
    level3: '+5',
    level4: '+10',
    level5: '+15'
  },
  font: null as string | null,
  audio: {
    level1: null,
    level2: null,
    level3: null,
    level4: null,
    level5: null
  }
};

type SessionUser = {
  userId: string;
};

declare module '@fastify/session' {
  interface SessionData {
    user?: SessionUser;
    oauthState?: string;
  }
}

app.get('/health', async () => ({ ok: true }));

app.setNotFoundHandler((req, reply) => {
  const url = req.url || '';
  if (url.startsWith('/api') || url.startsWith('/uploads') || url.startsWith('/ws')) {
    return reply.code(404).send({ error: 'Not Found' });
  }
  return reply.sendFile('index.html', clientDistDir);
});

app.get('/api/tension-default', async (_req, reply) => {
  return reply.send({
    tensionEnabled: TENSION_DEFAULTS.enabled,
    tensionFont: TENSION_DEFAULTS.font,
    tensionColors: TENSION_DEFAULTS.colors,
    tensionLabels: TENSION_DEFAULTS.labels,
    tensionAudio: TENSION_DEFAULTS.audio
  });
});

app.get('/t/:tenantId/api/config', async (req, reply) => {
  const tenantId = req.params.tenantId as string;
  const tenant = await prisma.tenant.findFirst({ where: { id: tenantId } });
  if (!tenant) return reply.status(404).send({ error: 'Tenant not found' });
  return reply.send({
    tensionEnabled: TENSION_DEFAULTS.enabled,
    tensionFont: TENSION_DEFAULTS.font,
    tensionColors: TENSION_DEFAULTS.colors,
    tensionLabels: TENSION_DEFAULTS.labels,
    tensionAudio: TENSION_DEFAULTS.audio
  });
});

app.get('/t/:tenantId/api/images', async (req, reply) => {
  const tenantId = req.params.tenantId as string;
  const tenant = await prisma.tenant.findFirst({ where: { id: tenantId } });
  if (!tenant) return reply.status(404).send({ error: 'Tenant not found' });
  const assets = await prisma.asset.findMany({
    where: { tenantId, type: 'image', hidden: false },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }]
  });
  return reply.send(
    assets.map(asset => ({
      id: asset.id,
      name: asset.name,
      url: asset.url,
      thumbUrl: asset.thumbUrl || null
    }))
  );
});

app.get('/t/:tenantId/api/audio', async (req, reply) => {
  const tenantId = req.params.tenantId as string;
  const tenant = await prisma.tenant.findFirst({ where: { id: tenantId } });
  if (!tenant) return reply.status(404).send({ error: 'Tenant not found' });
  const assets = await prisma.asset.findMany({
    where: { tenantId, type: 'audio', hidden: false },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }]
  });
  return reply.send(
    assets.map(asset => ({
      id: asset.id,
      name: asset.name,
      url: asset.url
    }))
  );
});

app.get('/t/:tenantId/api/sessions/:id', async (req, reply) => {
  const tenantId = req.params.tenantId as string;
  const sessionId = req.params.id as string;
  const session = await prisma.session.findFirst({
    where: { id: sessionId, tenantId }
  });
  if (!session) return reply.status(404).send({ error: 'Session not found' });
  const tensionColors = normalizeTensionColors(parseTensionValue(session.tensionColors));
  const tensionLabels = normalizeTensionLabels(parseTensionValue(session.tensionLabels));
  const tensionAudio = normalizeTensionAudio(parseTensionValue(session.tensionAudio));
  return reply.send({
    tensionEnabled: session.tensionEnabled ?? TENSION_DEFAULTS.enabled,
    tensionFont: session.tensionFont ?? TENSION_DEFAULTS.font,
    tensionColors: tensionColors || TENSION_DEFAULTS.colors,
    tensionLabels: tensionLabels || TENSION_DEFAULTS.labels,
    tensionAudio: tensionAudio || TENSION_DEFAULTS.audio
  });
});

const createTenantSchema = z.object({
  name: z.string().min(1).max(120)
});

app.post('/api/tenants', async (req, reply) => {
  const parsed = createTenantSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.status(400).send({ error: parsed.error.flatten() });
  }
  const tenant = await prisma.tenant.create({
    data: { name: parsed.data.name }
  });
  return reply.status(201).send(tenant);
});

function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  if (!req.session.user?.userId) {
    reply.status(401).send({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

async function getTenantId(req: FastifyRequest, reply: FastifyReply) {
  if (!requireAuth(req, reply)) return null;
  const user = await prisma.user.findUnique({
    where: { id: req.session.user!.userId },
    include: { tenant: true }
  });
  if (!user?.tenant) {
    reply.status(404).send({ error: 'Tenant not found' });
    return null;
  }
  return user.tenant.id;
}

async function requireAdmin(req: FastifyRequest, reply: FastifyReply) {
  if (!requireAuth(req, reply)) return null;
  const user = await prisma.user.findUnique({ where: { id: req.session.user!.userId } });
  if (!user || user.role?.toUpperCase() !== 'ADMIN') {
    reply.status(403).send({ error: 'Forbidden' });
    return null;
  }
  return user;
}

const scenarioCreateSchema = z.object({
  title: z.string().min(1).max(120),
  icon: z.string().optional().nullable()
});

const scenarioUpdateSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  icon: z.string().optional().nullable()
});

const sessionCreateSchema = z.object({
  title: z.string().min(1).max(120),
  icon: z.string().optional().nullable(),
  scenarioId: z.string().min(1)
});

const sessionUpdateSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  icon: z.string().optional().nullable(),
  scenarioId: z.string().min(1).optional(),
  tensionEnabled: z.boolean().optional(),
  tensionFont: z.string().nullable().optional(),
  tensionColors: z.record(z.string(), z.string()).optional(),
  tensionLabels: z.record(z.string(), z.string()).optional(),
  tensionAudio: z.record(z.string(), z.string().nullable()).optional()
});

const noteCreateSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().optional().nullable()
});

const noteUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().optional().nullable()
});

const sceneAssetSchema = z.object({
  name: z.string().min(1),
  order: z.number().int().optional()
});

const sceneCreateSchema = z.object({
  title: z.string().min(1).max(160),
  sessionId: z.string().min(1),
  images: z.array(sceneAssetSchema).optional(),
  audio: z.array(sceneAssetSchema).optional(),
  tension: z.number().int().nullable().optional(),
  notes: z.string().nullable().optional()
});

const sceneUpdateSchema = z.object({
  title: z.string().min(1).max(160).optional(),
  order: z.number().int().optional(),
  images: z.array(sceneAssetSchema).optional(),
  audio: z.array(sceneAssetSchema).optional(),
  tension: z.number().int().nullable().optional(),
  notes: z.string().nullable().optional()
});

const timerUpdateSchema = z.object({
  running: z.boolean(),
  elapsedMs: z.number().int().nonnegative(),
  startedAt: z.string().nullable().optional()
});

const hourglassUpdateSchema = z.object({
  durationSeconds: z.number().int().min(1).max(3600).optional(),
  showTimer: z.boolean().optional()
});

const gmStateUpdateSchema = z.object({
  tensionLevel: z.enum(['level1', 'level2', 'level3', 'level4', 'level5']).nullable().optional()
});

const parseSceneAssets = (value?: string | null) => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const serializeSceneAssets = (value?: { name: string; order?: number }[]) => {
  if (!value) return undefined;
  return JSON.stringify(value);
};

const parseTensionValue = (value?: string | null) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const normalizeTensionLabels = (labels?: Record<string, string> | null) => {
  const src = labels || {};
  const def = TENSION_DEFAULTS.labels;
  const trim = (v: unknown, fallback: string) =>
    typeof v === 'string' && v.trim().length ? v.trim().slice(0, 4) : fallback;
  return {
    level1: trim(src.level1, def.level1),
    level2: trim(src.level2, def.level2),
    level3: trim(src.level3, def.level3),
    level4: trim(src.level4, def.level4),
    level5: trim(src.level5, def.level5)
  };
};

const normalizeTensionColors = (colors?: Record<string, string> | null) => {
  const src = colors || {};
  const def = TENSION_DEFAULTS.colors;
  return {
    level1: typeof src.level1 === 'string' ? src.level1 : def.level1,
    level2: typeof src.level2 === 'string' ? src.level2 : def.level2,
    level3: typeof src.level3 === 'string' ? src.level3 : def.level3,
    level4: typeof src.level4 === 'string' ? src.level4 : def.level4,
    level5: typeof src.level5 === 'string' ? src.level5 : def.level5
  };
};

const getOrCreateGmState = async (tenantId: string, sessionId: string) => {
  let state = await prisma.sessionGmState.findFirst({
    where: { tenantId, sessionId }
  });
  if (!state) {
    state = await prisma.sessionGmState.create({
      data: { tenantId, sessionId }
    });
  }
  return state;
};

const normalizeTensionAudio = (audio?: Record<string, string | null> | null) => {
  const src = audio || {};
  const out: Record<string, string | null> = {};
  ['level1', 'level2', 'level3', 'level4', 'level5'].forEach(level => {
    out[level] = typeof src[level] === 'string' ? src[level] : null;
  });
  return out;
};

const serializeTension = (value: unknown) => JSON.stringify(value ?? {});

const ensureDefaultSceneForSession = async (session: { id: string; tenantId: string; scenarioId?: string | null }) => {
  const existing = await prisma.scene.findFirst({
    where: { tenantId: session.tenantId, sessionId: session.id }
  });
  if (existing) return;
  await prisma.scene.create({
    data: {
      tenantId: session.tenantId,
      sessionId: session.id,
      scenarioId: session.scenarioId || undefined,
      title: 'Scene 1',
      order: 1
    }
  });
};

const ensureDefaultSessionForScenario = async (scenario: { id: string; tenantId: string }) => {
  const existing = await prisma.session.findFirst({
    where: { tenantId: scenario.tenantId, scenarioId: scenario.id }
  });
  if (existing) return existing;
  const session = await prisma.session.create({
    data: {
      tenantId: scenario.tenantId,
      scenarioId: scenario.id,
      title: 'Session 1',
      tensionEnabled: TENSION_DEFAULTS.enabled,
      tensionFont: TENSION_DEFAULTS.font,
      tensionColors: serializeTension(TENSION_DEFAULTS.colors),
      tensionLabels: serializeTension(TENSION_DEFAULTS.labels),
      tensionAudio: serializeTension(TENSION_DEFAULTS.audio)
    }
  });
  await ensureDefaultSceneForSession(session);
  return session;
};

app.get('/api/scenarios', async (req, reply) => {
  const tenantId = await getTenantId(req, reply);
  if (!tenantId) return;
  const scenarios = await prisma.scenario.findMany({
    where: { tenantId },
    orderBy: { updatedAt: 'desc' },
    include: { sessions: { orderBy: { createdAt: 'asc' } } }
  });
  return reply.send(scenarios);
});

app.post('/api/scenarios', async (req, reply) => {
  const tenantId = await getTenantId(req, reply);
  if (!tenantId) return;
  const parsed = scenarioCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.status(400).send({ error: parsed.error.flatten() });
  }
  const scenario = await prisma.scenario.create({
    data: {
      tenantId,
      title: parsed.data.title,
      icon: parsed.data.icon || undefined
    }
  });
  await ensureDefaultSessionForScenario(scenario);
  const hydrated = await prisma.scenario.findUnique({
    where: { id: scenario.id },
    include: { sessions: { orderBy: { createdAt: 'asc' } } }
  });
  return reply.status(201).send(hydrated ?? scenario);
});

app.patch('/api/scenarios/:id', async (req, reply) => {
  const tenantId = await getTenantId(req, reply);
  if (!tenantId) return;
  const parsed = scenarioUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.status(400).send({ error: parsed.error.flatten() });
  }
  const scenario = await prisma.scenario.findFirst({
    where: { id: req.params.id as string, tenantId }
  });
  if (!scenario) return reply.status(404).send({ error: 'Not found' });
  const updated = await prisma.scenario.update({
    where: { id: scenario.id },
    data: {
      title: parsed.data.title ?? scenario.title,
      icon: parsed.data.icon ?? scenario.icon
    }
  });
  return reply.send(updated);
});

app.delete('/api/scenarios/:id', async (req, reply) => {
  const tenantId = await getTenantId(req, reply);
  if (!tenantId) return;
  const scenario = await prisma.scenario.findFirst({
    where: { id: req.params.id as string, tenantId }
  });
  if (!scenario) return reply.status(404).send({ error: 'Not found' });
  try {
    const sessions = await prisma.session.findMany({
      where: { tenantId, scenarioId: scenario.id },
      select: { id: true }
    });
    const sessionIds = sessions.map(sess => sess.id);
    await prisma.$transaction(async tx => {
      if (sessionIds.length) {
        await tx.scene.deleteMany({ where: { tenantId, sessionId: { in: sessionIds } } });
        await tx.characterSession.deleteMany({ where: { sessionId: { in: sessionIds } } });
        await tx.session.deleteMany({ where: { tenantId, id: { in: sessionIds } } });
      }
      await tx.scene.deleteMany({ where: { tenantId, scenarioId: scenario.id } });
      await tx.scenario.delete({ where: { id: scenario.id } });
    });
    return reply.send({ ok: true });
  } catch (err) {
    app.log.error({ err }, 'Delete scenario failed');
    return reply.status(400).send({ error: 'Unable to delete scenario' });
  }
});

app.get('/api/sessions', async (req, reply) => {
  const tenantId = await getTenantId(req, reply);
  if (!tenantId) return;
  const sessions = await prisma.session.findMany({
    where: { tenantId },
    orderBy: { updatedAt: 'desc' },
    include: { scenario: true }
  });
  return reply.send(
    sessions.map(session => ({
      ...session,
      tensionEnabled: session.tensionEnabled ?? TENSION_DEFAULTS.enabled,
      tensionFont: session.tensionFont ?? TENSION_DEFAULTS.font,
      tensionColors: normalizeTensionColors(parseTensionValue(session.tensionColors)),
      tensionLabels: normalizeTensionLabels(parseTensionValue(session.tensionLabels)),
      tensionAudio: normalizeTensionAudio(parseTensionValue(session.tensionAudio))
    }))
  );
});

app.get('/api/sessions/:id', async (req, reply) => {
  const tenantId = await getTenantId(req, reply);
  if (!tenantId) return;
  const session = await prisma.session.findFirst({
    where: { id: req.params.id as string, tenantId },
    include: { scenario: true }
  });
  if (!session) return reply.status(404).send({ error: 'Not found' });
  return reply.send({
    ...session,
    tensionEnabled: session.tensionEnabled ?? TENSION_DEFAULTS.enabled,
    tensionFont: session.tensionFont ?? TENSION_DEFAULTS.font,
    tensionColors: normalizeTensionColors(parseTensionValue(session.tensionColors)),
    tensionLabels: normalizeTensionLabels(parseTensionValue(session.tensionLabels)),
    tensionAudio: normalizeTensionAudio(parseTensionValue(session.tensionAudio))
  });
});

app.get('/api/sessions/:id/gm-state', async (req, reply) => {
  const tenantId = await getTenantId(req, reply);
  if (!tenantId) return;
  const sessionId = req.params.id as string;
  const session = await prisma.session.findFirst({ where: { id: sessionId, tenantId } });
  if (!session) return reply.status(404).send({ error: 'Session not found' });
  const state = await getOrCreateGmState(tenantId, sessionId);
  return reply.send({
    tensionLevel: state.tensionLevel,
    timer: {
      running: state.timerRunning,
      elapsedMs: state.timerElapsedMs,
      startedAt: state.timerStartedAt ? state.timerStartedAt.toISOString() : null
    },
    hourglass: {
      durationSeconds: state.hourglassDuration,
      showTimer: state.hourglassShowTimer
    }
  });
});

app.put('/api/sessions/:id/gm-state', async (req, reply) => {
  const tenantId = await getTenantId(req, reply);
  if (!tenantId) return;
  const sessionId = req.params.id as string;
  const session = await prisma.session.findFirst({ where: { id: sessionId, tenantId } });
  if (!session) return reply.status(404).send({ error: 'Session not found' });
  const parsed = gmStateUpdateSchema.safeParse(req.body);
  if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
  const state = await getOrCreateGmState(tenantId, sessionId);
  const updated = await prisma.sessionGmState.update({
    where: { id: state.id },
    data: {
      tensionLevel: parsed.data.tensionLevel ?? state.tensionLevel
    }
  });
  return reply.send({ tensionLevel: updated.tensionLevel });
});

app.put('/api/sessions/:id/timer', async (req, reply) => {
  const tenantId = await getTenantId(req, reply);
  if (!tenantId) return;
  const sessionId = req.params.id as string;
  const session = await prisma.session.findFirst({ where: { id: sessionId, tenantId } });
  if (!session) return reply.status(404).send({ error: 'Session not found' });
  const parsed = timerUpdateSchema.safeParse(req.body);
  if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
  const startedAt = parsed.data.startedAt ? new Date(parsed.data.startedAt) : null;
  const state = await getOrCreateGmState(tenantId, sessionId);
  const updated = await prisma.sessionGmState.update({
    where: { id: state.id },
    data: {
      timerRunning: parsed.data.running,
      timerElapsedMs: parsed.data.elapsedMs,
      timerStartedAt: startedAt
    }
  });
  return reply.send({
    running: updated.timerRunning,
    elapsedMs: updated.timerElapsedMs,
    startedAt: updated.timerStartedAt ? updated.timerStartedAt.toISOString() : null
  });
});

app.put('/api/sessions/:id/hourglass', async (req, reply) => {
  const tenantId = await getTenantId(req, reply);
  if (!tenantId) return;
  const sessionId = req.params.id as string;
  const session = await prisma.session.findFirst({ where: { id: sessionId, tenantId } });
  if (!session) return reply.status(404).send({ error: 'Session not found' });
  const parsed = hourglassUpdateSchema.safeParse(req.body);
  if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
  const state = await getOrCreateGmState(tenantId, sessionId);
  const updated = await prisma.sessionGmState.update({
    where: { id: state.id },
    data: {
      hourglassDuration: parsed.data.durationSeconds ?? state.hourglassDuration,
      hourglassShowTimer: parsed.data.showTimer ?? state.hourglassShowTimer
    }
  });
  return reply.send({
    durationSeconds: updated.hourglassDuration,
    showTimer: updated.hourglassShowTimer
  });
});

app.post('/api/session-runs', async (req, reply) => {
  const tenantId = await getTenantId(req, reply);
  if (!tenantId) return;
  const parsed = z.object({ sessionId: z.string().min(1).optional().nullable() }).safeParse(req.body);
  if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
  const sessionId = parsed.data.sessionId || '';
  if (!sessionId) return reply.status(400).send({ error: 'sessionId is required' });
  const session = await prisma.session.findFirst({ where: { id: sessionId, tenantId } });
  if (!session) return reply.status(404).send({ error: 'Session not found' });

  const now = Date.now();
  const last = await getLastRun(tenantId, sessionId);
  const gmAlreadyOnline = last && last.gm === 'online';
  const run = gmAlreadyOnline
    ? await updateLatestRun(tenantId, sessionId, {
        gm: 'online',
        front: last?.front || 'offline',
        lastGmPing: now,
        lastFrontPing: last?.lastFrontPing ? last.lastFrontPing.getTime() : null,
        updatedAt: now
      })
    : await appendSessionRun(tenantId, sessionId, {
        gm: 'online',
        front: 'offline',
        lastGmPing: now,
        lastFrontPing: null,
        createdAt: now,
        updatedAt: now
      });

  presence.updatePresence(tenantId, sessionId, 'gm', 'online');
  return reply.send(run || { ok: true });
});

app.post('/api/sessions', async (req, reply) => {
  const tenantId = await getTenantId(req, reply);
  if (!tenantId) return;
  const parsed = sessionCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.status(400).send({ error: parsed.error.flatten() });
  }
  const scenarioId = parsed.data.scenarioId;
  const scenario = await prisma.scenario.findFirst({ where: { id: scenarioId, tenantId } });
  if (!scenario) return reply.status(400).send({ error: 'Invalid scenario' });
  const session = await prisma.session.create({
    data: {
      tenantId,
      title: parsed.data.title,
      icon: parsed.data.icon || undefined,
      scenarioId,
      tensionEnabled: TENSION_DEFAULTS.enabled,
      tensionFont: TENSION_DEFAULTS.font,
      tensionColors: serializeTension(TENSION_DEFAULTS.colors),
      tensionLabels: serializeTension(TENSION_DEFAULTS.labels),
      tensionAudio: serializeTension(TENSION_DEFAULTS.audio)
    },
    include: { scenario: true }
  });
  await ensureDefaultSceneForSession(session);
  return reply.status(201).send(session);
});

app.patch('/api/sessions/:id', async (req, reply) => {
  const tenantId = await getTenantId(req, reply);
  if (!tenantId) return;
  const parsed = sessionUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.status(400).send({ error: parsed.error.flatten() });
  }
  const session = await prisma.session.findFirst({
    where: { id: req.params.id as string, tenantId }
  });
  if (!session) return reply.status(404).send({ error: 'Not found' });
  const nextScenarioId = parsed.data.scenarioId ?? session.scenarioId;
  if (!nextScenarioId) return reply.status(400).send({ error: 'Scenario required' });
  const scenario = await prisma.scenario.findFirst({ where: { id: nextScenarioId, tenantId } });
  if (!scenario) return reply.status(400).send({ error: 'Invalid scenario' });
  const updated = await prisma.session.update({
    where: { id: session.id },
    data: {
      title: parsed.data.title ?? session.title,
      icon: parsed.data.icon ?? session.icon,
      scenarioId: nextScenarioId,
      tensionEnabled: parsed.data.tensionEnabled ?? session.tensionEnabled,
      tensionFont: parsed.data.tensionFont ?? session.tensionFont,
      tensionColors: parsed.data.tensionColors
        ? serializeTension(normalizeTensionColors(parsed.data.tensionColors))
        : session.tensionColors,
      tensionLabels: parsed.data.tensionLabels
        ? serializeTension(normalizeTensionLabels(parsed.data.tensionLabels))
        : session.tensionLabels,
      tensionAudio: parsed.data.tensionAudio
        ? serializeTension(normalizeTensionAudio(parsed.data.tensionAudio))
        : session.tensionAudio
    },
    include: { scenario: true }
  });
  return reply.send({
    ...updated,
    tensionEnabled: updated.tensionEnabled ?? TENSION_DEFAULTS.enabled,
    tensionFont: updated.tensionFont ?? TENSION_DEFAULTS.font,
    tensionColors: normalizeTensionColors(parseTensionValue(updated.tensionColors)),
    tensionLabels: normalizeTensionLabels(parseTensionValue(updated.tensionLabels)),
    tensionAudio: normalizeTensionAudio(parseTensionValue(updated.tensionAudio))
  });
});

app.delete('/api/sessions/:id', async (req, reply) => {
  const tenantId = await getTenantId(req, reply);
  if (!tenantId) return;
  const session = await prisma.session.findFirst({
    where: { id: req.params.id as string, tenantId }
  });
  if (!session) return reply.status(404).send({ error: 'Not found' });
  try {
    await prisma.$transaction(async tx => {
      await tx.scene.deleteMany({ where: { tenantId, sessionId: session.id } });
      await tx.characterSession.deleteMany({ where: { sessionId: session.id } });
      await tx.session.delete({ where: { id: session.id } });
    });
    return reply.send({ ok: true });
  } catch (err) {
    app.log.error({ err }, 'Delete session failed');
    return reply.status(400).send({ error: 'Unable to delete session' });
  }
});

app.get('/api/scenes', async (req, reply) => {
  const tenantId = await getTenantId(req, reply);
  if (!tenantId) return;
  const sessionId = (req.query as { sessionId?: string }).sessionId;
  const scenes = await prisma.scene.findMany({
    where: { tenantId, ...(sessionId ? { sessionId } : {}) },
    orderBy: [{ order: 'asc' }, { updatedAt: 'desc' }]
  });
  return reply.send(
    scenes.map(scene => ({
      ...scene,
      images: parseSceneAssets(scene.images),
      audio: parseSceneAssets(scene.audio)
    }))
  );
});

app.get('/api/scenes/:id', async (req, reply) => {
  const tenantId = await getTenantId(req, reply);
  if (!tenantId) return;
  const scene = await prisma.scene.findFirst({
    where: { id: req.params.id as string, tenantId }
  });
  if (!scene) return reply.status(404).send({ error: 'Not found' });
  return reply.send({
    ...scene,
    images: parseSceneAssets(scene.images),
    audio: parseSceneAssets(scene.audio)
  });
});

app.get('/api/scenes/:id/note', async (req, reply) => {
  const tenantId = await getTenantId(req, reply);
  if (!tenantId) return;
  const scene = await prisma.scene.findFirst({
    where: { id: req.params.id as string, tenantId }
  });
  if (!scene) return reply.status(404).send({ error: 'Not found' });
  if (!scene.notes) return reply.send({ content: '' });
  const note = await prisma.note.findFirst({
    where: { id: scene.notes, tenantId }
  });
  return reply.send({ content: note?.content || '' });
});

app.put('/api/scenes/:id/note', async (req, reply) => {
  const tenantId = await getTenantId(req, reply);
  if (!tenantId) return;
  const scene = await prisma.scene.findFirst({
    where: { id: req.params.id as string, tenantId }
  });
  if (!scene) return reply.status(404).send({ error: 'Not found' });
  const parsed = z.object({ content: z.string().optional().nullable() }).safeParse(req.body);
  if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
  const content = (parsed.data.content || '').toString();
  if (!content.trim()) {
    if (scene.notes) {
      await prisma.scene.update({
        where: { id: scene.id },
        data: { notes: null }
      });
      await prisma.note.delete({ where: { id: scene.notes } }).catch(() => null);
    }
    return reply.send({ content: '' });
  }
  if (scene.notes) {
    await prisma.note.update({
      where: { id: scene.notes },
      data: { content }
    }).catch(async () => {
      const created = await prisma.note.create({
        data: { tenantId, title: scene.title || 'Scene', content }
      });
      await prisma.scene.update({
        where: { id: scene.id },
        data: { notes: created.id }
      });
    });
  } else {
    const created = await prisma.note.create({
      data: { tenantId, title: scene.title || 'Scene', content }
    });
    await prisma.scene.update({
      where: { id: scene.id },
      data: { notes: created.id }
    });
  }
  return reply.send({ content });
});

app.post('/api/scenes', async (req, reply) => {
  const tenantId = await getTenantId(req, reply);
  if (!tenantId) return;
  const parsed = sceneCreateSchema.safeParse(req.body);
  if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
  const session = await prisma.session.findFirst({
    where: { id: parsed.data.sessionId, tenantId }
  });
  if (!session) return reply.status(400).send({ error: 'Invalid session' });
  if (!session.scenarioId) return reply.status(400).send({ error: 'Session missing scenario' });
  const lastOrder = await prisma.scene.aggregate({
    where: { tenantId, sessionId: session.id },
    _max: { order: true }
  });
  const scene = await prisma.scene.create({
    data: {
      tenantId,
      sessionId: session.id,
      scenarioId: session.scenarioId,
      title: parsed.data.title,
      order: (lastOrder._max.order || 0) + 1,
      images: serializeSceneAssets(parsed.data.images ?? []),
      audio: serializeSceneAssets(parsed.data.audio ?? []),
      tension: parsed.data.tension ?? null,
      notes: parsed.data.notes ?? null
    }
  });
  return reply.status(201).send({
    ...scene,
    images: parseSceneAssets(scene.images),
    audio: parseSceneAssets(scene.audio)
  });
});

app.patch('/api/scenes/:id', async (req, reply) => {
  const tenantId = await getTenantId(req, reply);
  if (!tenantId) return;
  const parsed = sceneUpdateSchema.safeParse(req.body);
  if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
  const scene = await prisma.scene.findFirst({
    where: { id: req.params.id as string, tenantId }
  });
  if (!scene) return reply.status(404).send({ error: 'Not found' });
  const updated = await prisma.scene.update({
    where: { id: scene.id },
    data: {
      title: parsed.data.title ?? scene.title,
      order: parsed.data.order ?? scene.order,
      images: parsed.data.images ? serializeSceneAssets(parsed.data.images) : scene.images,
      audio: parsed.data.audio ? serializeSceneAssets(parsed.data.audio) : scene.audio,
      tension: parsed.data.tension ?? scene.tension,
      notes: parsed.data.notes ?? scene.notes
    }
  });
  return reply.send({
    ...updated,
    images: parseSceneAssets(updated.images),
    audio: parseSceneAssets(updated.audio)
  });
});

app.delete('/api/scenes/:id', async (req, reply) => {
  const tenantId = await getTenantId(req, reply);
  if (!tenantId) return;
  const scene = await prisma.scene.findFirst({
    where: { id: req.params.id as string, tenantId }
  });
  if (!scene) return reply.status(404).send({ error: 'Not found' });
  await prisma.scene.delete({ where: { id: scene.id } });
  return reply.send({ ok: true });
});

app.get('/api/notes', async (req, reply) => {
  const tenantId = await getTenantId(req, reply);
  if (!tenantId) return;
  const notes = await prisma.note.findMany({
    where: { tenantId },
    orderBy: { updatedAt: 'desc' }
  });
  return reply.send(notes);
});

app.get('/api/notes/:id', async (req, reply) => {
  const tenantId = await getTenantId(req, reply);
  if (!tenantId) return;
  const note = await prisma.note.findFirst({
    where: { id: req.params.id as string, tenantId }
  });
  if (!note) return reply.status(404).send({ error: 'Not found' });
  return reply.send(note);
});

app.post('/api/notes', async (req, reply) => {
  const tenantId = await getTenantId(req, reply);
  if (!tenantId) return;
  const parsed = noteCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.status(400).send({ error: parsed.error.flatten() });
  }
  const note = await prisma.note.create({
    data: {
      tenantId,
      title: parsed.data.title,
      content: parsed.data.content ?? ''
    }
  });
  return reply.status(201).send(note);
});

app.put('/api/notes/:id', async (req, reply) => {
  const tenantId = await getTenantId(req, reply);
  if (!tenantId) return;
  const parsed = noteUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.status(400).send({ error: parsed.error.flatten() });
  }
  const existing = await prisma.note.findFirst({
    where: { id: req.params.id as string, tenantId }
  });
  if (!existing) return reply.status(404).send({ error: 'Not found' });
  const updated = await prisma.note.update({
    where: { id: existing.id },
    data: {
      title: parsed.data.title ?? existing.title,
      content: parsed.data.content ?? existing.content
    }
  });
  return reply.send(updated);
});

app.delete('/api/notes/:id', async (req, reply) => {
  const tenantId = await getTenantId(req, reply);
  if (!tenantId) return;
  const noteId = req.params.id as string;
  const note = await prisma.note.findFirst({ where: { id: noteId, tenantId } });
  if (!note) return reply.status(404).send({ error: 'Not found' });
  await prisma.$transaction(async tx => {
    await tx.scene.updateMany({
      where: { tenantId, notes: noteId },
      data: { notes: null }
    });
    await tx.note.delete({ where: { id: noteId } });
  });
  return reply.send({ ok: true });
});

app.get('/api/admin/users', async (req, reply) => {
  const admin = await requireAdmin(req, reply);
  if (!admin) return;

  const [users, setting] = await Promise.all([
    prisma.user.findMany({ include: { tenant: true } }),
    prisma.appSetting.findFirst()
  ]);

  const tenantIds = users.map(u => u.tenant?.id).filter(Boolean) as string[];

  const [scenarioCounts, noteCounts, assetCounts, assetUsage] = await Promise.all([
    prisma.scenario.groupBy({ by: ['tenantId'], _count: { _all: true }, where: { tenantId: { in: tenantIds } } }),
    prisma.note.groupBy({ by: ['tenantId'], _count: { _all: true }, where: { tenantId: { in: tenantIds } } }),
    prisma.asset.groupBy({ by: ['tenantId', 'type'], _count: { _all: true }, where: { tenantId: { in: tenantIds } } }),
    prisma.asset.groupBy({ by: ['tenantId'], _sum: { size: true }, where: { tenantId: { in: tenantIds } } })
  ]);

  const scenarioMap = new Map(scenarioCounts.map(item => [item.tenantId, item._count._all]));
  const noteMap = new Map(noteCounts.map(item => [item.tenantId, item._count._all]));
  const assetMap = new Map<string, { images: number; audios: number }>();
  assetCounts.forEach(item => {
    const entry = assetMap.get(item.tenantId) || { images: 0, audios: 0 };
    if (item.type === 'image') entry.images += item._count._all;
    if (item.type === 'audio') entry.audios += item._count._all;
    assetMap.set(item.tenantId, entry);
  });
  const usageMap = new Map(assetUsage.map(item => [item.tenantId, item._sum.size || 0]));

  const payload = users.map(u => {
    const tenantId = u.tenant?.id || null;
    const assets = tenantId ? assetMap.get(tenantId) : null;
    return {
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      role: u.role,
      tenantId,
      tenantName: u.tenant?.name || null,
      quotaMB: u.tenant?.quotaMB ?? null,
      quotaOverride: u.tenant?.quotaMB != null,
      defaultQuotaMB: setting?.defaultQuotaMB ?? null,
      scenarioCount: tenantId ? scenarioMap.get(tenantId) || 0 : 0,
      noteCount: tenantId ? noteMap.get(tenantId) || 0 : 0,
      imageCount: assets?.images || 0,
      audioCount: assets?.audios || 0,
      usageBytes: tenantId ? usageMap.get(tenantId) || 0 : 0,
      lastLogin: u.lastLogin
    };
  });

  return reply.send(payload);
});

app.get('/api/admin/run-states', async (req, reply) => {
  const admin = await requireAdmin(req, reply);
  if (!admin) return;
  const grouped = await getRunStatesGrouped();
  return reply.send(grouped);
});

app.get('/api/admin/global-quota', async (req, reply) => {
  const admin = await requireAdmin(req, reply);
  if (!admin) return;
  const setting = await prisma.appSetting.findFirst();
  return reply.send({ defaultQuotaMB: setting?.defaultQuotaMB ?? null });
});

app.put('/api/admin/global-quota', async (req, reply) => {
  const admin = await requireAdmin(req, reply);
  if (!admin) return;
  const parsed = z.object({ defaultQuotaMB: z.number().positive() }).safeParse(req.body);
  if (!parsed.success) {
    return reply.status(400).send({ error: 'Invalid quota' });
  }
  const setting = await prisma.appSetting.findFirst();
  const updated = setting
    ? await prisma.appSetting.update({
        where: { id: setting.id },
        data: { defaultQuotaMB: parsed.data.defaultQuotaMB }
      })
    : await prisma.appSetting.create({ data: { defaultQuotaMB: parsed.data.defaultQuotaMB } });
  return reply.send({ defaultQuotaMB: updated.defaultQuotaMB });
});

app.put('/api/admin/tenant-quota', async (req, reply) => {
  const admin = await requireAdmin(req, reply);
  if (!admin) return;
  const parsed = z
    .object({ tenantId: z.string().min(1), quotaMB: z.number().positive().nullable() })
    .safeParse(req.body);
  if (!parsed.success) {
    return reply.status(400).send({ error: 'Invalid quota' });
  }
  const tenant = await prisma.tenant.findUnique({ where: { id: parsed.data.tenantId } });
  if (!tenant) return reply.status(404).send({ error: 'Tenant not found' });
  const updated = await prisma.tenant.update({
    where: { id: tenant.id },
    data: { quotaMB: parsed.data.quotaMB }
  });
  return reply.send({ tenantId: updated.id, quotaMB: updated.quotaMB });
});

app.delete('/api/admin/user/:id', async (req, reply) => {
  const admin = await requireAdmin(req, reply);
  if (!admin) return;
  const userId = req.params.id as string;
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { tenant: true } });
  if (!user) return reply.status(404).send({ error: 'Not found' });
  await prisma.user.delete({ where: { id: userId } });
  if (user.tenant?.id) {
    await prisma.tenant.delete({ where: { id: user.tenant.id } }).catch(() => undefined);
  }
  return reply.send({ ok: true });
});

app.get('/api/assets', async (req, reply) => {
  const tenantId = await getTenantId(req, reply);
  if (!tenantId) return;
  const type = (req.query as { type?: string }).type;
  const assets = await prisma.asset.findMany({
    where: { tenantId, ...(type ? { type } : {}) },
    orderBy: [{ hidden: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }]
  });
  return reply.send(assets);
});

app.get('/api/tenant/usage', async (req, reply) => {
  const tenantId = await getTenantId(req, reply);
  if (!tenantId) return;
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  const usage = await prisma.asset.aggregate({
    where: { tenantId },
    _sum: { size: true }
  });
  return reply.send({
    usageBytes: usage._sum.size || 0,
    quotaMB: tenant?.quotaMB ?? null
  });
});

app.post('/api/assets/upload', async (req, reply) => {
  const tenantId = await getTenantId(req, reply);
  if (!tenantId) return;
  const tenantDir = getTenantUploadDir(tenantId);
  try {
    const file = await req.file();
    if (!file || file.type !== 'file') return reply.status(400).send({ error: 'No file' });

    const filename = uniqueFilename(file.filename);
    const filepath = path.join(tenantDir, filename);
    await pipeline(file.file, fs.createWriteStream(filepath));

    const stat = fs.statSync(filepath);
    if (stat.size > MAX_IMAGE_BYTES) {
      fs.unlinkSync(filepath);
      return reply.status(400).send({ error: 'File too large' });
    }
    let thumbUrl: string | null = null;
    try {
      const thumb = await generateThumbnail(filepath, filename, tenantDir);
      thumbUrl = `/uploads/${tenantId}/${thumb.thumbName}`;
    } catch (err) {
      app.log.warn({ err }, 'Thumbnail generation failed');
    }
    const lastOrder = await prisma.asset.aggregate({
      where: { tenantId, type: 'image' },
      _max: { sortOrder: true }
    });
    const asset = await prisma.asset.create({
      data: {
        tenantId,
        type: 'image',
        name: sanitizeName(file.filename),
        url: `/uploads/${tenantId}/${filename}`,
        thumbUrl,
        size: stat.size,
        sortOrder: (lastOrder._max.sortOrder || 0) + 1
      }
    });
    return reply.status(201).send(asset);
  } catch (err) {
    app.log.error({ err }, 'Upload failed');
    return reply.status(500).send({ error: 'Upload failed' });
  }
});

app.post('/api/assets/audio/upload', async (req, reply) => {
  const tenantId = await getTenantId(req, reply);
  if (!tenantId) return;
  const tenantDir = getTenantUploadDir(tenantId);
  try {
    const file = await req.file();
    if (!file || file.type !== 'file') return reply.status(400).send({ error: 'No file' });
    if (!file.mimetype?.startsWith('audio/')) return reply.status(400).send({ error: 'Invalid file type' });

    const filename = uniqueFilename(file.filename);
    const filepath = path.join(tenantDir, filename);
    await pipeline(file.file, fs.createWriteStream(filepath));

    const stat = fs.statSync(filepath);
    if (stat.size > MAX_AUDIO_BYTES) {
      fs.unlinkSync(filepath);
      return reply.status(400).send({ error: 'File too large' });
    }
    const lastOrder = await prisma.asset.aggregate({
      where: { tenantId, type: 'audio' },
      _max: { sortOrder: true }
    });
    const asset = await prisma.asset.create({
      data: {
        tenantId,
        type: 'audio',
        name: sanitizeName(file.filename),
        url: `/uploads/${tenantId}/${filename}`,
        size: stat.size,
        sortOrder: (lastOrder._max.sortOrder || 0) + 1
      }
    });
    return reply.status(201).send(asset);
  } catch (err) {
    app.log.error({ err }, 'Audio upload failed');
    return reply.status(500).send({ error: 'Upload failed' });
  }
});

app.post('/api/assets/from-url', async (req, reply) => {
  const tenantId = await getTenantId(req, reply);
  if (!tenantId) return;
  const parsed = z.object({ url: z.string().url() }).safeParse(req.body);
  if (!parsed.success) return reply.status(400).send({ error: 'Invalid url' });
  const tenantDir = getTenantUploadDir(tenantId);
  const res = await fetch(parsed.data.url);
  if (!res.ok) return reply.status(400).send({ error: 'Unable to fetch' });
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.startsWith('image/')) return reply.status(400).send({ error: 'Not an image' });
  const urlObj = new URL(parsed.data.url);
  const baseName = path.basename(urlObj.pathname) || 'image';
  const filename = uniqueFilename(baseName);
  const filepath = path.join(tenantDir, filename);
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(filepath, buffer);
  const stat = fs.statSync(filepath);
  let thumbUrl: string | null = null;
  try {
    const thumb = await generateThumbnail(filepath, filename, tenantDir);
    thumbUrl = `/uploads/${tenantId}/${thumb.thumbName}`;
  } catch (err) {
    app.log.warn({ err }, 'Thumbnail generation failed');
  }
  const lastOrder = await prisma.asset.aggregate({
    where: { tenantId, type: 'image' },
    _max: { sortOrder: true }
  });
  const asset = await prisma.asset.create({
    data: {
      tenantId,
      type: 'image',
      name: sanitizeName(baseName),
      url: `/uploads/${tenantId}/${filename}`,
      thumbUrl,
      size: stat.size,
      sortOrder: (lastOrder._max.sortOrder || 0) + 1
    }
  });
  return reply.status(201).send(asset);
});

app.get('/api/assets/pixabay', async (req, reply) => {
  const tenantId = await getTenantId(req, reply);
  if (!tenantId) return;
  const key = process.env.PIXABAY_KEY;
  if (!key) return reply.status(400).send({ error: 'Missing PIXABAY_KEY' });
  const query = (req.query as { q?: string }).q || '';
  const url = new URL('https://pixabay.com/api/');
  url.searchParams.set('key', key);
  url.searchParams.set('q', query);
  url.searchParams.set('image_type', 'photo');
  url.searchParams.set('per_page', '24');
  const res = await fetch(url.toString());
  const data = await res.json();
  if (!res.ok) return reply.status(400).send({ error: 'Pixabay error' });
  return reply.send({ hits: data.hits || [] });
});

app.patch('/api/assets/:id', async (req, reply) => {
  const tenantId = await getTenantId(req, reply);
  if (!tenantId) return;
  const parsed = z.object({ name: z.string().min(1).max(200) }).safeParse(req.body);
  if (!parsed.success) return reply.status(400).send({ error: 'Invalid name' });
  const asset = await prisma.asset.findFirst({ where: { id: req.params.id as string, tenantId } });
  if (!asset) return reply.status(404).send({ error: 'Not found' });
  const updated = await prisma.asset.update({
    where: { id: asset.id },
    data: { name: sanitizeName(parsed.data.name) }
  });
  return reply.send(updated);
});

app.put('/api/assets/order', async (req, reply) => {
  const tenantId = await getTenantId(req, reply);
  if (!tenantId) return;
  const parsed = z.object({ ids: z.array(z.string().min(1)) }).safeParse(req.body);
  if (!parsed.success) return reply.status(400).send({ error: 'Invalid payload' });
  const ids = parsed.data.ids;
  if (!ids.length) return reply.send({ ok: true });
  const updates = ids.map((id, index) =>
    prisma.asset.updateMany({
      where: { id, tenantId },
      data: { sortOrder: index + 1 }
    })
  );
  await prisma.$transaction(updates);
  return reply.send({ ok: true });
});

app.patch('/api/assets/visibility', async (req, reply) => {
  const tenantId = await getTenantId(req, reply);
  if (!tenantId) return;
  const parsed = z
    .object({ ids: z.array(z.string().min(1)), hidden: z.boolean() })
    .safeParse(req.body);
  if (!parsed.success) return reply.status(400).send({ error: 'Invalid payload' });
  await prisma.asset.updateMany({
    where: { id: { in: parsed.data.ids }, tenantId },
    data: { hidden: parsed.data.hidden }
  });
  return reply.send({ ok: true });
});

app.delete('/api/assets/:id', async (req, reply) => {
  const tenantId = await getTenantId(req, reply);
  if (!tenantId) return;
  const asset = await prisma.asset.findFirst({ where: { id: req.params.id as string, tenantId } });
  if (!asset) return reply.status(404).send({ error: 'Not found' });
  await prisma.asset.delete({ where: { id: asset.id } });
  return reply.send({ ok: true });
});

const discordConfig = () => ({
  clientId: process.env.DISCORD_CLIENT_ID || '',
  clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
  redirectUri: process.env.DISCORD_REDIRECT_URI || '',
  scopes: (process.env.DISCORD_SCOPES || 'identify email').split(',').map(s => s.trim()).filter(Boolean)
});

app.get('/auth/discord/login', async (req, reply) => {
  const devBypassEnabled = process.env.DEV_BYPASS_DISCORD === '1';
  if (process.env.NODE_ENV !== 'production' && devBypassEnabled) {
    const devEmail = process.env.DEV_ADMIN_EMAIL || 'dev-admin@local';
    const devName = process.env.DEV_ADMIN_NAME || 'Dev Admin';

    let user = await prisma.user.findUnique({ where: { email: devEmail }, include: { tenant: true } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: devEmail,
          displayName: devName,
          role: 'ADMIN',
          lastLogin: new Date(),
          tenant: {
            create: { name: devName }
          }
        },
        include: { tenant: true }
      });
    } else {
      if (!user.tenant) {
        await prisma.tenant.create({
          data: { name: devName, owner: { connect: { id: user.id } } }
        });
      }
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: 'ADMIN', displayName: user.displayName || devName, lastLogin: new Date() },
        include: { tenant: true }
      });
    }

    req.session.user = { userId: user.id };
    const redirect = process.env.APP_REDIRECT_URL || 'http://localhost:3001/app';
    return reply.redirect(redirect);
  }

  const { clientId, redirectUri, scopes } = discordConfig();
  if (!clientId || !redirectUri) {
    return reply.status(503).send({ error: 'Discord OAuth not configured' });
  }
  const state = cryptoRandomState();
  req.session.oauthState = state;

  const url = new URL('https://discord.com/api/oauth2/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', scopes.join(' '));
  url.searchParams.set('state', state);
  return reply.redirect(url.toString());
});

app.get('/auth/discord/callback', async (req, reply) => {
  const { clientId, clientSecret, redirectUri } = discordConfig();
  const { code, state } = req.query as { code?: string; state?: string };

  if (!clientId || !clientSecret || !redirectUri) {
    return reply.status(503).send({ error: 'Discord OAuth not configured' });
  }
  if (!code || !state || state !== req.session.oauthState) {
    return reply.status(400).send({ error: 'Invalid OAuth state' });
  }
  req.session.oauthState = undefined;

  const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri
    })
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || !tokenData.access_token) {
    app.log.error({ tokenData }, 'Discord token error');
    return reply.status(400).send({ error: 'Discord OAuth failed' });
  }

  const userRes = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` }
  });
  const userData = await userRes.json();
  if (!userRes.ok || !userData.id) {
    app.log.error({ userData }, 'Discord user error');
    return reply.status(400).send({ error: 'Unable to fetch Discord user' });
  }

  const discordId: string = userData.id;
  const displayName: string | null = userData.global_name || userData.username || null;
  const discNum = Number(userData.discriminator || '0');
  const avatarUrl = userData.avatar
    ? `https://cdn.discordapp.com/avatars/${discordId}/${userData.avatar}.png?size=128`
    : `https://cdn.discordapp.com/embed/avatars/${discNum % 5}.png`;
  const email: string | null = userData.email || null;

  const user = await upsertDiscordUser({
    discordId,
    email,
    displayName,
    avatarUrl
  });

  req.session.user = { userId: user.id };

  const redirect = process.env.APP_REDIRECT_URL || 'http://localhost:5173/';
  return reply.redirect(redirect);
});

app.post('/auth/logout', async (req, reply) => {
  req.session.user = undefined;
  reply.send({ ok: true });
});

app.get('/auth/me', async (req, reply) => {
  if (!requireAuth(req, reply)) return;
  const user = await prisma.user.findUnique({
    where: { id: req.session.user!.userId },
    include: { tenant: true }
  });
  if (!user) return reply.status(404).send({ error: 'Not found' });
  return reply.send({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    role: user.role,
    tenant: user.tenant
  });
});

async function upsertDiscordUser(params: {
  discordId: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string;
}) {
  const { discordId, email, displayName, avatarUrl } = params;

  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { discordId },
        ...(email ? [{ email }] : [])
      ]
    },
    include: { tenant: true }
  });

  if (!existing) {
    const tenantName = displayName || email || 'Tenant';
    return prisma.user.create({
      data: {
        email: email || `discord_${discordId}@placeholder.local`,
        discordId,
        displayName,
        avatarUrl,
        role: 'USER',
        lastLogin: new Date(),
        tenant: {
          create: {
            name: tenantName
          }
        }
      }
    });
  }

  return prisma.user.update({
    where: { id: existing.id },
    data: {
      discordId,
      displayName: displayName || existing.displayName,
      avatarUrl,
      ...(email ? { email } : {}),
      lastLogin: new Date()
    },
    include: { tenant: true }
  });
}

function cryptoRandomState() {
  return crypto.randomBytes(16).toString('hex');
}

const port = Number(process.env.PORT || 3100);
app.listen({ port, host: '0.0.0.0' });
