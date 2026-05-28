import type { SQLiteDatabase } from 'expo-sqlite';
import type { FileRow } from '@/types/files';
import { File } from 'expo-file-system';

export async function getFilesForSnippet(
  db: SQLiteDatabase,
  snippetId: string,
  folder: string
): Promise<FileRow[]> {
  return db.getAllAsync<FileRow>(
    `SELECT id, name, uri, mime_type, size_bytes, snippet_id, folder, created_at
     FROM files WHERE snippet_id = ? AND folder = ? ORDER BY created_at DESC`,
    [snippetId, folder]
  );
}

export async function insertFile(
  db: SQLiteDatabase,
  row: Omit<FileRow, 'id'>
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO files (name, uri, mime_type, size_bytes, snippet_id, folder, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      row.name,
      row.uri,
      row.mime_type,
      row.size_bytes,
      row.snippet_id,
      row.folder,
      row.created_at,
    ]
  );
  return result.lastInsertRowId;
}

export async function deleteFileRow(db: SQLiteDatabase, id: number): Promise<void> {
  const row = await db.getFirstAsync<{ uri: string }>(`SELECT uri FROM files WHERE id = ?`, [id]);
  if (row?.uri) {
    try {
      const f = new File(row.uri);
      if (f.exists) f.delete();
    } catch {
      /* ignore missing file */
    }
  }
  await db.runAsync(`DELETE FROM files WHERE id = ?`, [id]);
}

export async function deleteFilesForSnippet(db: SQLiteDatabase, snippetId: string): Promise<void> {
  const rows = await db.getAllAsync<{ id: number; uri: string }>(
    `SELECT id, uri FROM files WHERE snippet_id = ?`,
    [snippetId]
  );
  for (const row of rows) {
    await deleteFileRow(db, row.id);
  }
}
