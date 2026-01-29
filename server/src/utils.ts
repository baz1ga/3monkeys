import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function uniqueFilename(original: string, extFallback = '.png') {
  const ext = path.extname(original) || extFallback;
  const base = crypto.randomBytes(6).toString('hex');
  return `img-${Date.now()}-${base}${ext}`;
}

export function sanitizeName(name: string) {
  return name.replace(/[\r\n\t]/g, ' ').trim();
}
