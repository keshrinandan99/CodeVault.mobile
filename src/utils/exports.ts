import { File } from 'expo-file-system';
import type { SQLiteDatabase } from 'expo-sqlite';
import type { Snippet } from '@/types/snippet';
import { ensureCodevaultDirs, getExportsDir, fileSize } from '@/utils/paths';
import { insertFile } from '@/utils/filesDb';

export type ExportFormat = 'ts' | 'txt' | 'json';

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'snippet';
}

function extensionFor(format: ExportFormat): string {
  return format;
}

function buildContent(snippet: Snippet, format: ExportFormat): string {
  if (format === 'ts') return snippet.code;
  if (format === 'txt') return `${snippet.title}\n\n${snippet.code}`;
  return JSON.stringify(
    {
      title: snippet.title,
      language: snippet.language,
      code: snippet.code,
      tags: snippet.tag,
      created_at: snippet.create_at.toISOString(),
    },
    null,
    2
  );
}

export async function exportSnippet(
  db: SQLiteDatabase,
  snippet: Snippet,
  format: ExportFormat
): Promise<{ uri: string; name: string }> {
  ensureCodevaultDirs();
  const ext = extensionFor(format);
  const name = `${slugify(snippet.title)}-${Date.now()}.${ext}`;
  const dest = new File(getExportsDir(), name);
  if (!dest.exists) dest.create();
  dest.write(buildContent(snippet, format));

  const mime =
    format === 'json'
      ? 'application/json'
      : format === 'ts'
        ? 'text/typescript'
        : 'text/plain';

  await insertFile(db, {
    name,
    uri: dest.uri,
    mime_type: mime,
    size_bytes: fileSize(dest.uri),
    snippet_id: snippet.id,
    folder: 'exports',
    created_at: Date.now(),
  });

  return { uri: dest.uri, name };
}
