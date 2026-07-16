import { mkdir, readdir, readFile, unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

export type RemovalStatus = 'pending' | 'approved' | 'rejected';

export interface RemovalRequest {
  id: string;
  shareId: string;
  shareName: string;
  reason: string;
  email: string;
  status: RemovalStatus;
  createdAt: string;
  processedAt: string | null;
}

const REQUESTS_DIR = join(process.cwd(), 'src', 'data', 'removal-requests');

async function ensureDir() {
  await mkdir(REQUESTS_DIR, { recursive: true });
}

export async function createRemovalRequest(
  data: Omit<RemovalRequest, 'id' | 'createdAt' | 'processedAt' | 'status'>,
) {
  await ensureDir();
  const request: RemovalRequest = {
    ...data,
    id: randomUUID(),
    status: 'pending',
    createdAt: new Date().toISOString(),
    processedAt: null,
  };
  await writeFile(join(REQUESTS_DIR, `${request.id}.json`), JSON.stringify(request, null, 2));
  return request;
}

export async function listRemovalRequests() {
  await ensureDir();
  const files = await readdir(REQUESTS_DIR);
  const requests: RemovalRequest[] = [];
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    try {
      requests.push(JSON.parse(await readFile(join(REQUESTS_DIR, file), 'utf8')) as RemovalRequest);
    } catch {
      // Ignore malformed request files.
    }
  }
  return requests.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getRemovalRequest(id: string) {
  try {
    return JSON.parse(await readFile(join(REQUESTS_DIR, `${id}.json`), 'utf8')) as RemovalRequest;
  } catch {
    return null;
  }
}

export async function updateRemovalRequest(request: RemovalRequest) {
  await ensureDir();
  await writeFile(join(REQUESTS_DIR, `${request.id}.json`), JSON.stringify(request, null, 2));
  return request;
}

export async function removeShareFile(shareId: string) {
  const sharePath = join(process.cwd(), 'src', 'data', 'shares', `${shareId}.json`);
  await unlink(sharePath);
  await unlink(join(process.cwd(), 'src', 'data', 'shares', `${shareId}.svg`)).catch(() => {});
}
