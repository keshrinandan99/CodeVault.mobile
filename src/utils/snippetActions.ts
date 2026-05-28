import * as Crypto from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';
import type { DbSnippetRow } from '@/utils/snippetDb';
import { deleteAiForSnippet } from '@/utils/ai';
import { deleteFilesForSnippet } from '@/utils/filesDb';

export async function duplicateSnippet(
  db: SQLiteDatabase,
  row: DbSnippetRow
): Promise<string> {
  const newId = Crypto.randomUUID();
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO snippets (id, title, language, code, tags, create_at, updated_at, is_favourite)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
    [newId, `${row.title} (copy)`, row.language, row.code, row.tags, now, now]
  );
  return newId;
}

export async function deleteSnippetCascade(db: SQLiteDatabase, id: string): Promise<void> {
  await deleteFilesForSnippet(db, id);
  await deleteAiForSnippet(db, id);
  await db.runAsync(`DELETE FROM snippets WHERE id = ?`, [id]);
}
