import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { ensureDir } from '../src/utils';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

const prisma = new PrismaClient();
const uploadsDir = path.resolve(__dirname, '..', 'uploads');

const moveIfNeeded = (fromPath: string, toPath: string) => {
  if (!fs.existsSync(fromPath)) {
    return false;
  }
  ensureDir(path.dirname(toPath));
  if (fs.existsSync(toPath)) {
    return true;
  }
  fs.renameSync(fromPath, toPath);
  return true;
};

const hasTenantPath = (url: string, tenantId: string) =>
  url.includes(`/uploads/${tenantId}/`);

const run = async () => {
  ensureDir(uploadsDir);
  const assets = await prisma.asset.findMany();
  let updated = 0;
  let skipped = 0;
  let missing = 0;

  for (const asset of assets) {
    const tenantDir = path.join(uploadsDir, asset.tenantId);
    ensureDir(tenantDir);

    let nextUrl = asset.url || '';
    let nextThumb = asset.thumbUrl || null;
    let touched = false;

    if (asset.url && !hasTenantPath(asset.url, asset.tenantId)) {
      const fileName = path.basename(asset.url);
      const fromPath = path.join(uploadsDir, fileName);
      const toPath = path.join(tenantDir, fileName);
      const moved = moveIfNeeded(fromPath, toPath);
      if (!moved && !fs.existsSync(toPath)) {
        missing += 1;
      }
      nextUrl = `/uploads/${asset.tenantId}/${fileName}`;
      touched = true;
    }

    if (asset.thumbUrl && !hasTenantPath(asset.thumbUrl, asset.tenantId)) {
      const thumbName = path.basename(asset.thumbUrl);
      const fromPath = path.join(uploadsDir, thumbName);
      const toPath = path.join(tenantDir, thumbName);
      const moved = moveIfNeeded(fromPath, toPath);
      if (!moved && !fs.existsSync(toPath)) {
        missing += 1;
      }
      nextThumb = `/uploads/${asset.tenantId}/${thumbName}`;
      touched = true;
    }

    if (touched) {
      await prisma.asset.update({
        where: { id: asset.id },
        data: { url: nextUrl, thumbUrl: nextThumb }
      });
      updated += 1;
    } else {
      skipped += 1;
    }
  }

  console.log(`[migrate-uploads] updated=${updated} skipped=${skipped} missing=${missing}`);
};

run()
  .catch(err => {
    console.error('[migrate-uploads] failed', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
