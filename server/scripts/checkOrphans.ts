import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

const prisma = new PrismaClient();

const args = new Map<string, string>();
process.argv.slice(2).forEach((arg, idx, all) => {
  if (!arg.startsWith('--')) return;
  const key = arg.replace(/^--/, '');
  const value = all[idx + 1] && !all[idx + 1].startsWith('--') ? all[idx + 1] : 'true';
  args.set(key, value);
});

const fix = args.get('fix') === 'true';

const toIdSet = (rows: { id: string }[]) => new Set(rows.map(r => r.id));

const logList = (label: string, ids: string[]) => {
  console.log(`${label}: ${ids.length}`);
  if (ids.length) {
    ids.slice(0, 20).forEach(id => console.log(`  - ${id}`));
    if (ids.length > 20) console.log(`  ... ${ids.length - 20} more`);
  }
};

const run = async () => {
  const tenants = await prisma.tenant.findMany({ select: { id: true } });
  const scenarios = await prisma.scenario.findMany({ select: { id: true, tenantId: true } });
  const sessions = await prisma.session.findMany({ select: { id: true, tenantId: true, scenarioId: true } });
  const scenes = await prisma.scene.findMany({ select: { id: true, tenantId: true, sessionId: true, scenarioId: true, notes: true } });
  const notes = await prisma.note.findMany({ select: { id: true, tenantId: true } });
  const assets = await prisma.asset.findMany({ select: { id: true, tenantId: true } });
  const gmStates = await prisma.sessionGmState.findMany({ select: { id: true, tenantId: true, sessionId: true } });
  const runStates = await prisma.sessionRunState.findMany({ select: { id: true, tenantId: true, sessionId: true } });
  const characters = await prisma.character.findMany({ select: { id: true, tenantId: true, scenarioId: true } });
  const characterSessions = await prisma.characterSession.findMany({ select: { characterId: true, sessionId: true } });

  const tenantIds = toIdSet(tenants);
  const scenarioIds = toIdSet(scenarios);
  const sessionIds = toIdSet(sessions);
  const noteIds = toIdSet(notes);
  const characterIds = toIdSet(characters);

  const orphanScenarios = scenarios.filter(s => !tenantIds.has(s.tenantId)).map(s => s.id);
  const orphanSessions = sessions.filter(s => !tenantIds.has(s.tenantId) || (s.scenarioId && !scenarioIds.has(s.scenarioId))).map(s => s.id);
  const orphanScenes = scenes
    .filter(s => !tenantIds.has(s.tenantId) || (s.sessionId && !sessionIds.has(s.sessionId)) || (s.scenarioId && !scenarioIds.has(s.scenarioId)))
    .map(s => s.id);
  const orphanNotes = notes.filter(n => !tenantIds.has(n.tenantId)).map(n => n.id);
  const danglingSceneNotes = scenes.filter(s => s.notes && !noteIds.has(s.notes)).map(s => s.id);
  const orphanAssets = assets.filter(a => !tenantIds.has(a.tenantId)).map(a => a.id);
  const orphanGmStates = gmStates.filter(s => !tenantIds.has(s.tenantId) || !sessionIds.has(s.sessionId)).map(s => s.id);
  const orphanRunStates = runStates.filter(r => !tenantIds.has(r.tenantId) || !sessionIds.has(r.sessionId)).map(r => r.id);
  const orphanCharacters = characters.filter(c => !tenantIds.has(c.tenantId) || (c.scenarioId && !scenarioIds.has(c.scenarioId))).map(c => c.id);
  const orphanCharacterSessions = characterSessions
    .filter(cs => !characterIds.has(cs.characterId) || !sessionIds.has(cs.sessionId))
    .map(cs => `${cs.characterId}:${cs.sessionId}`);

  console.log(`[check-orphans] fix=${fix}`);
  logList('orphanScenarios', orphanScenarios);
  logList('orphanSessions', orphanSessions);
  logList('orphanScenes', orphanScenes);
  logList('orphanNotes', orphanNotes);
  logList('danglingSceneNotes', danglingSceneNotes);
  logList('orphanAssets', orphanAssets);
  logList('orphanGmStates', orphanGmStates);
  logList('orphanRunStates', orphanRunStates);
  logList('orphanCharacters', orphanCharacters);
  logList('orphanCharacterSessions', orphanCharacterSessions);

  if (!fix) return;

  if (danglingSceneNotes.length) {
    await prisma.scene.updateMany({
      where: { id: { in: danglingSceneNotes } },
      data: { notes: null }
    });
  }

  if (orphanCharacterSessions.length) {
    const pairs = orphanCharacterSessions.map(value => {
      const [characterId, sessionId] = value.split(':');
      return { characterId, sessionId };
    });
    for (const pair of pairs) {
      await prisma.characterSession.delete({ where: { characterId_sessionId: pair } }).catch(() => null);
    }
  }

  if (orphanScenes.length) {
    await prisma.scene.deleteMany({ where: { id: { in: orphanScenes } } });
  }
  if (orphanGmStates.length) {
    await prisma.sessionGmState.deleteMany({ where: { id: { in: orphanGmStates } } });
  }
  if (orphanRunStates.length) {
    await prisma.sessionRunState.deleteMany({ where: { id: { in: orphanRunStates } } });
  }
  if (orphanSessions.length) {
    await prisma.session.deleteMany({ where: { id: { in: orphanSessions } } });
  }
  if (orphanCharacters.length) {
    await prisma.character.deleteMany({ where: { id: { in: orphanCharacters } } });
  }
  if (orphanScenarios.length) {
    await prisma.scenario.deleteMany({ where: { id: { in: orphanScenarios } } });
  }
  if (orphanAssets.length) {
    await prisma.asset.deleteMany({ where: { id: { in: orphanAssets } } });
  }
  if (orphanNotes.length) {
    await prisma.note.deleteMany({ where: { id: { in: orphanNotes } } });
  }

  console.log('[check-orphans] cleanup complete');
};

run()
  .catch(err => {
    console.error('[check-orphans] failed', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
