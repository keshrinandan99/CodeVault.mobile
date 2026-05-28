import { Stack } from 'expo-router';
import { SQLiteProvider, type SQLiteDatabase } from 'expo-sqlite';

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="codevault.db" onInit={migrateDbIfNeeded}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="snippets" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="files" />
        <Stack.Screen name="favourite" />
      </Stack>
    </SQLiteProvider>
  );
}

async function columnExists(db: SQLiteDatabase, table: string, column: string) {
  const cols = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  return cols.some((c) => c.name === column);
}

async function migrateDbIfNeeded(db: SQLiteDatabase) {
  await db.execAsync(`PRAGMA journal_mode = 'wal'`);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS snippets (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      language TEXT NOT NULL,
      code TEXT NOT NULL,
      tags TEXT NOT NULL,
      create_at INTEGER NOT NULL,
      is_favourite INTEGER NOT NULL DEFAULT 0
    );
  `);

  if (!(await columnExists(db, 'snippets', 'updated_at'))) {
    await db.execAsync(`ALTER TABLE snippets ADD COLUMN updated_at INTEGER;`);
    await db.execAsync(`UPDATE snippets SET updated_at = create_at WHERE updated_at IS NULL;`);
  }

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      uri TEXT NOT NULL,
      mime_type TEXT,
      size_bytes INTEGER NOT NULL DEFAULT 0,
      snippet_id TEXT,
      folder TEXT,
      created_at INTEGER NOT NULL
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ai_explanations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      snippet_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      content TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      model TEXT,
      created_at INTEGER NOT NULL,
      UNIQUE(snippet_id, kind)
    );
  `);

  const first = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM snippets`
  );
  if ((first?.count ?? 0) === 0) {
    const now = Date.now();
    await db.execAsync(`
      INSERT INTO snippets (id,title,language,code,tags,create_at,updated_at,is_favourite)
      VALUES ('1','useDebounce hook','TypeScript','import { useState, useEffect } from ''react'';\n\nfunction useDebounce<T>(value: T, delay: number = 300): T {\n  const [debounced, setDebounced] = useState<T>(value);\n  useEffect(() => {\n    const id = setTimeout(() => setDebounced(value), delay);\n    return () => clearTimeout(id);\n  }, [value, delay]);\n  return debounced;\n}','hooks,react,utils', ${now - 2 * 60 * 60 * 1000}, ${now - 2 * 60 * 60 * 1000}, 1);
      INSERT INTO snippets (id,title,language,code,tags,create_at,updated_at,is_favourite)
      VALUES ('2','Flatten nested array','JavaScript','const flatten = (arr) => arr.flat(Infinity);','array,functional', ${now - 24 * 60 * 60 * 1000}, ${now - 24 * 60 * 60 * 1000}, 0);
      INSERT INTO snippets (id,title,language,code,tags,create_at,updated_at,is_favourite)
      VALUES ('3','SQLite init script','Shell','sqlite3 mydb.db < schema.sql','db,setup', ${now - 3 * 24 * 60 * 60 * 1000}, ${now - 3 * 24 * 60 * 60 * 1000}, 0);
    `);
  }
}
