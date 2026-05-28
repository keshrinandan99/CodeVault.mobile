import type { SQLiteDatabase } from 'expo-sqlite';

export async function toggleFavoriteInDb(
  db: SQLiteDatabase,
  id: string,
  current: boolean
): Promise<boolean> {
  const next = current ? 0 : 1;
  await db.runAsync(`UPDATE snippets SET is_favourite = ? WHERE id = ?`, [next, id]);
  return next === 1;
}
