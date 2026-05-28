import { Directory, File, Paths } from 'expo-file-system';

export function getCodevaultRoot(): Directory {
  return new Directory(Paths.document, 'codevault');
}

export function getAttachmentsDir(): Directory {
  return new Directory(getCodevaultRoot(), 'attachments');
}

export function getExportsDir(): Directory {
  return new Directory(getCodevaultRoot(), 'exports');
}

export function ensureDirExists(dir: Directory): void {
  if (!dir.exists) {
    dir.create({ idempotent: true });
  }
}

export function ensureCodevaultDirs(): void {
  ensureDirExists(getCodevaultRoot());
  ensureDirExists(getAttachmentsDir());
  ensureDirExists(getExportsDir());
}

export function fileSize(uri: string): number {
  try {
    const f = new File(uri);
    return f.exists ? (f.info().size ?? 0) : 0;
  } catch {
    return 0;
  }
}
