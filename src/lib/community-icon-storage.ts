import { mkdir, readFile, unlink, writeFile } from 'fs/promises';
import { join } from 'path';

const DIRECTORY = join(process.cwd(), 'src', 'data', 'community-icons');

export async function writeCommunityIcon(id: string, svg: string) {
  await mkdir(DIRECTORY, { recursive: true });
  await writeFile(join(DIRECTORY, `${id}.svg`), svg, 'utf8');
  return `community-icons/${id}.svg`;
}

export async function readCommunityIcon(id: string) {
  return readFile(join(DIRECTORY, `${id}.svg`), 'utf8');
}

export async function removeCommunityIcon(id: string) {
  await unlink(join(DIRECTORY, `${id}.svg`)).catch(() => {});
}
