import { mkdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { randomBytes } from 'crypto';

type Invitation = { userId: string; email: string; expiresAt: string };
const FILE = join(process.cwd(), 'src', 'data', 'admin-invitations.json');
async function readInvitations(): Promise<Record<string, Invitation>> { try { return JSON.parse(await readFile(FILE, 'utf8')) as Record<string, Invitation>; } catch { return {}; } }
export async function createAdminInvitation(invitation: Omit<Invitation, 'expiresAt'>) { const data = await readInvitations(); const token = randomBytes(32).toString('hex'); data[token] = { ...invitation, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }; await mkdir(join(process.cwd(), 'src', 'data'), { recursive: true }); await writeFile(FILE, JSON.stringify(data, null, 2)); return token; }
export async function consumeAdminInvitation(token: string) { const data = await readInvitations(); const invitation = data[token]; if (!invitation || new Date(invitation.expiresAt) < new Date()) return null; delete data[token]; await writeFile(FILE, JSON.stringify(data, null, 2)); return invitation; }
