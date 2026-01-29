import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { ensureDir } from '../src/utils';

type LegacyUser = {
  email: string;
  password?: string | null;
  discordId?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  tenantId?: string | null;
  admin?: boolean;
  createdAt?: string | null;
  lastLogin?: string | null;
};

type LegacyScenario = {
  id: string;
  tenantId: string;
  title: string;
  sessions?: string[];
  icon?: string | null;
  createdAt?: number | null;
  updatedAt?: number | null;
};

type LegacySession = {
  id: string;
  tenantId: string;
  title: string;
  parentScenario?: string | null;
  createdAt?: number | null;
  updatedAt?: number | null;
  timer?: { running?: boolean; elapsedMs?: number; startedAt?: number | null } | null;
  hourglass?: { durationSeconds?: number; showTimer?: boolean } | null;
  tensionEnabled?: boolean;
  tensionFont?: string | null;
  tensionColors?: Record<string, string> | null;
  tensionLabels?: Record<string, string> | null;
  tensionAudio?: Record<string, string | null> | null;
};

type LegacyScene = {
  id: string;
  tenantId: string;
  title: string;
  parentSession?: string | null;
  order?: number | null;
  images?: { name: string; order?: number }[] | null;
  audio?: { name: string; order?: number }[] | null;
  tension?: number | null;
  notes?: string | null;
  createdAt?: number | null;
  updatedAt?: number | null;
};

type LegacyConfig = {
  tensionEnabled?: boolean;
  tensionColors?: Record<string, string> | null;
  tensionLabels?: Record<string, string> | null;
  tensionFont?: string | null;
  tensionAudio?: Record<string, string | null> | null;
  quotaMB?: number | null;
  lang?: string | null;
};

type LegacyRunState = {
  front?: string | null;
  gm?: string | null;
  lastFrontPing?: number | null;
  lastGmPing?: number | null;
  createdAt?: number | null;
  updatedAt?: number | null;
};

type LegacyRunStateFile = {
  sessionId: string;
  runs: LegacyRunState[];
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

const prisma = new PrismaClient();
const uploadsDir = path.resolve(__dirname, '..', 'uploads');

const args = new Map<string, string>();
process.argv.slice(2).forEach((arg, idx, all) => {
  if (!arg.startsWith('--')) return;
  const key = arg.replace(/^--/, '');
  const value = all[idx + 1] && !all[idx + 1].startsWith('--') ? all[idx + 1] : 'true';
  args.set(key, value);
});

const sourceRoot = args.get('source') || '/srv/scenarwall/data';
const usersPath = args.get('users') || path.join(sourceRoot, 'users.json');
const tenantsDir = args.get('tenants') || path.join(sourceRoot, 'tenants');
const dryRun = args.get('dry-run') === 'true';
const onlyTenant = args.get('tenant') || '';

const readJson = <T>(filePath: string): T | null => {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
  } catch (err) {
    console.error(`[migrate-legacy] invalid json ${filePath}`, err);
    return null;
  }
};

const toDateFromSeconds = (value?: number | null) => (value ? new Date(value * 1000) : undefined);
const toDateFromMillis = (value?: number | null) => (value ? new Date(value) : undefined);

const ensureUploadCopy = (fromPath: string, toPath: string) => {
  ensureDir(path.dirname(toPath));
  if (fs.existsSync(toPath)) return;
  fs.copyFileSync(fromPath, toPath);
};

const loadJsonFiles = <T>(dir: string): T[] => {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter(name => name.endsWith('.json'))
    .map(name => readJson<T>(path.join(dir, name)))
    .filter((entry): entry is T => Boolean(entry));
};

const listFiles = (dir: string) => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(name => !name.endsWith('.json'));
};

const mapSortOrder = (names: string[], orderList: string[]) => {
  const base = new Map<string, number>();
  orderList.forEach((name, idx) => base.set(name, idx + 1));
  const max = orderList.length;
  let extra = max + 1;
  const out = new Map<string, number>();
  names.forEach(name => {
    if (base.has(name)) {
      out.set(name, base.get(name)!);
    } else {
      out.set(name, extra);
      extra += 1;
    }
  });
  return out;
};

const ensureTenant = async (user: LegacyUser, name: string, quotaMB?: number | null) => {
  if (dryRun) return null;
  const existingUser = await prisma.user.findUnique({
    where: { email: user.email },
    include: { tenant: true }
  });
  if (existingUser?.tenant) {
    await prisma.tenant.update({
      where: { id: existingUser.tenant.id },
      data: { name, quotaMB: quotaMB ?? null }
    });
    return existingUser.tenant;
  }
  const tenant = await prisma.tenant.create({
    data: {
      name,
      quotaMB: quotaMB ?? null
    }
  });
  return tenant;
};

const upsertUser = async (user: LegacyUser, tenantId: string) => {
  if (!user.email) return null;
  const createdAt = user.createdAt ? new Date(user.createdAt) : undefined;
  const lastLogin = user.lastLogin ? new Date(user.lastLogin) : undefined;
  const role = user.admin ? 'ADMIN' : 'USER';
  if (dryRun) return null;
  const saved = await prisma.user.upsert({
    where: { email: user.email },
    create: {
      email: user.email,
      displayName: user.displayName || null,
      avatarUrl: user.avatarUrl || null,
      discordId: user.discordId || null,
      role,
      lastLogin,
      createdAt
    },
    update: {
      displayName: user.displayName || null,
      avatarUrl: user.avatarUrl || null,
      discordId: user.discordId || null,
      role,
      lastLogin
    }
  });
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { ownerId: saved.id }
  });
  return saved;
};

const importScenarios = async (tenantId: string, tenantDir: string, scenarioMap: Map<string, string>) => {
  const scenarioDir = path.join(tenantDir, 'scenario');
  const scenarios = loadJsonFiles<LegacyScenario>(scenarioDir);
  for (const sc of scenarios) {
    if (dryRun) continue;
    const created = await prisma.scenario.create({
      data: {
        tenantId,
        title: sc.title || 'Scenario',
        icon: sc.icon || null,
        createdAt: toDateFromSeconds(sc.createdAt),
        updatedAt: toDateFromSeconds(sc.updatedAt)
      }
    });
    scenarioMap.set(sc.id, created.id);
  }
};

const importSessions = async (tenantId: string, tenantDir: string, scenarioMap: Map<string, string>, sessionMap: Map<string, string>) => {
  const sessionDir = path.join(tenantDir, 'sessions');
  const sessions = loadJsonFiles<LegacySession>(sessionDir);
  for (const sess of sessions) {
    if (dryRun) continue;
    const created = await prisma.session.create({
      data: {
        tenantId,
        scenarioId: sess.parentScenario ? scenarioMap.get(sess.parentScenario) || null : null,
        title: sess.title || 'Session',
        tensionEnabled: sess.tensionEnabled ?? true,
        tensionFont: sess.tensionFont || null,
        tensionColors: sess.tensionColors ? JSON.stringify(sess.tensionColors) : null,
        tensionLabels: sess.tensionLabels ? JSON.stringify(sess.tensionLabels) : null,
        tensionAudio: sess.tensionAudio ? JSON.stringify(sess.tensionAudio) : null,
        createdAt: toDateFromSeconds(sess.createdAt),
        updatedAt: toDateFromSeconds(sess.updatedAt)
      }
    });
    sessionMap.set(sess.id, created.id);

    const timer = sess.timer || {};
    const hourglass = sess.hourglass || {};
    await prisma.sessionGmState.upsert({
      where: { sessionId: created.id },
      create: {
        tenantId,
        sessionId: created.id,
        timerRunning: Boolean(timer.running),
        timerElapsedMs: timer.elapsedMs || 0,
        timerStartedAt: toDateFromMillis(timer.startedAt ?? null),
        hourglassDuration: hourglass.durationSeconds ?? 60,
        hourglassShowTimer: Boolean(hourglass.showTimer)
      },
      update: {
        timerRunning: Boolean(timer.running),
        timerElapsedMs: timer.elapsedMs || 0,
        timerStartedAt: toDateFromMillis(timer.startedAt ?? null),
        hourglassDuration: hourglass.durationSeconds ?? 60,
        hourglassShowTimer: Boolean(hourglass.showTimer)
      }
    });
  }
};

const importScenes = async (tenantId: string, tenantDir: string, sessionMap: Map<string, string>, sessionScenario: Map<string, string | null>, scenarioMap: Map<string, string>) => {
  const sceneDir = path.join(tenantDir, 'scenes');
  const scenes = loadJsonFiles<LegacyScene>(sceneDir);
  for (const scene of scenes) {
    let noteId: string | null = null;
    if (scene.notes && scene.notes.trim().length) {
      if (!dryRun) {
        const note = await prisma.note.create({
          data: {
            tenantId,
            title: scene.title || 'Scene',
            content: scene.notes
          }
        });
        noteId = note.id;
      }
    }
    if (dryRun) continue;
    const legacySessionId = scene.parentSession || '';
    const legacyScenarioId = sessionScenario.get(legacySessionId) || null;
    await prisma.scene.create({
      data: {
        tenantId,
        sessionId: legacySessionId ? sessionMap.get(legacySessionId) || null : null,
        scenarioId: legacyScenarioId ? scenarioMap.get(legacyScenarioId) || null : null,
        title: scene.title || 'Scene',
        order: scene.order ?? 0,
        images: scene.images ? JSON.stringify(scene.images) : null,
        audio: scene.audio ? JSON.stringify(scene.audio) : null,
        tension: scene.tension ?? null,
        notes: noteId,
        createdAt: toDateFromSeconds(scene.createdAt),
        updatedAt: toDateFromSeconds(scene.updatedAt)
      }
    });
  }
};

const importAssets = async (tenantId: string, tenantDir: string) => {
  ensureDir(uploadsDir);
  const tenantUploadDir = path.join(uploadsDir, tenantId);
  ensureDir(tenantUploadDir);

  const imagesDir = path.join(tenantDir, 'images');
  const audioDir = path.join(tenantDir, 'audio');

  const imageOrder = readJson<string[]>(path.join(imagesDir, 'images-order.json')) || [];
  const imageHidden = new Set(readJson<string[]>(path.join(imagesDir, 'images-hidden.json')) || []);
  const imageFiles = listFiles(imagesDir);
  const imageSort = mapSortOrder(imageFiles, imageOrder);

  for (const name of imageFiles) {
    const fromPath = path.join(imagesDir, name);
    const toPath = path.join(tenantUploadDir, name);
    if (!dryRun) ensureUploadCopy(fromPath, toPath);
    const stat = fs.statSync(fromPath);
    const thumbUrl = null;
    if (dryRun) continue;
    const existing = await prisma.asset.findFirst({
      where: { tenantId, type: 'image', name }
    });
    if (existing) {
      await prisma.asset.update({
        where: { id: existing.id },
        data: {
          url: `/uploads/${tenantId}/${name}`,
          thumbUrl,
          size: stat.size,
          hidden: imageHidden.has(name),
          sortOrder: imageSort.get(name) || 0
        }
      });
    } else {
      await prisma.asset.create({
        data: {
          tenantId,
          type: 'image',
          name,
          url: `/uploads/${tenantId}/${name}`,
          thumbUrl,
          size: stat.size,
          hidden: imageHidden.has(name),
          sortOrder: imageSort.get(name) || 0
        }
      });
    }
  }

  const audioOrder = readJson<string[]>(path.join(audioDir, 'audio-order.json')) || [];
  const audioFiles = listFiles(audioDir);
  const audioSort = mapSortOrder(audioFiles, audioOrder);

  for (const name of audioFiles) {
    const fromPath = path.join(audioDir, name);
    const toPath = path.join(tenantUploadDir, name);
    if (!dryRun) ensureUploadCopy(fromPath, toPath);
    const stat = fs.statSync(fromPath);
    if (dryRun) continue;
    const existing = await prisma.asset.findFirst({
      where: { tenantId, type: 'audio', name }
    });
    if (existing) {
      await prisma.asset.update({
        where: { id: existing.id },
        data: {
          url: `/uploads/${tenantId}/${name}`,
          size: stat.size,
          sortOrder: audioSort.get(name) || 0
        }
      });
    } else {
      await prisma.asset.create({
        data: {
          tenantId,
          type: 'audio',
          name,
          url: `/uploads/${tenantId}/${name}`,
          size: stat.size,
          sortOrder: audioSort.get(name) || 0
        }
      });
    }
  }
};

const importRunStates = async (tenantId: string, tenantDir: string, sessionMap: Map<string, string>) => {
  const runFile = path.join(tenantDir, 'run-states.json');
  const runData = readJson<LegacyRunStateFile[]>(runFile);
  if (!runData) return;
  for (const entry of runData) {
    const nextSessionId = sessionMap.get(entry.sessionId) || null;
    if (!nextSessionId) continue;
    for (const run of entry.runs || []) {
      if (dryRun) continue;
      await prisma.sessionRunState.create({
        data: {
          tenantId,
          sessionId: nextSessionId,
          front: run.front || 'offline',
          gm: run.gm || 'offline',
          lastFrontPing: toDateFromMillis(run.lastFrontPing ?? null),
          lastGmPing: toDateFromMillis(run.lastGmPing ?? null),
          createdAt: toDateFromMillis(run.createdAt ?? null),
          updatedAt: toDateFromMillis(run.updatedAt ?? null)
        }
      });
    }
  }
};

const migrateTenant = async (user: LegacyUser) => {
  const tenantId = user.tenantId;
  if (!tenantId) return;
  if (onlyTenant && tenantId !== onlyTenant) return;
  const tenantDir = path.join(tenantsDir, tenantId);
  if (!fs.existsSync(tenantDir)) {
    console.warn(`[migrate-legacy] missing tenant dir: ${tenantDir}`);
    return;
  }

  const config = readJson<LegacyConfig>(path.join(tenantDir, 'config.json'));
  const tenantName = user.displayName || user.email || tenantId;
  const tenant = await ensureTenant(user, tenantName, config?.quotaMB ?? null);
  const targetTenantId = tenant?.id || '';
  if (!dryRun && !targetTenantId) {
    throw new Error(`Unable to create tenant for ${tenantId}`);
  }
  if (!dryRun) {
    await upsertUser(user, targetTenantId);
  }

  const scenarioMap = new Map<string, string>();
  const sessionMap = new Map<string, string>();
  const sessionDir = path.join(tenantDir, 'sessions');
  const sessionList = loadJsonFiles<LegacySession>(sessionDir);
  const sessionScenario = new Map<string, string | null>();
  sessionList.forEach(sess => {
    sessionScenario.set(sess.id, sess.parentScenario || null);
  });

  await importScenarios(targetTenantId, tenantDir, scenarioMap);
  await importSessions(targetTenantId, tenantDir, scenarioMap, sessionMap);
  await importScenes(targetTenantId, tenantDir, sessionMap, sessionScenario, scenarioMap);
  await importAssets(targetTenantId, tenantDir);
  await importRunStates(targetTenantId, tenantDir, sessionMap);
};

const run = async () => {
  if (!fs.existsSync(usersPath)) {
    throw new Error(`users.json not found: ${usersPath}`);
  }
  const users = readJson<LegacyUser[]>(usersPath) || [];
  ensureDir(uploadsDir);

  console.log(`[migrate-legacy] users=${users.length} source=${sourceRoot} dryRun=${dryRun}`);
  for (const user of users) {
    await migrateTenant(user);
  }
  console.log('[migrate-legacy] done');
};

run()
  .catch(err => {
    console.error('[migrate-legacy] failed', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
