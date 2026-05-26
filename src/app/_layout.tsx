import { Stack } from "expo-router";
import { SQLiteProvider, type SQLiteDatabase } from "expo-sqlite";

export default function RootLayout() {
  return (
    <SQLiteProvider
      databaseName="codevault.db"
      onInit={migrateDbIfNeeded}
    >
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

async function migrateDbIfNeeded(db: SQLiteDatabase) {
  // Optional but recommended
  await db.execAsync(`PRAGMA journal_mode = 'wal'`);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS snippets (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      language TEXT NOT NULL,
      code TEXT NOT NULL,
      tags TEXT NOT NULL,           -- store tags as comma-separated string
      create_at INTEGER NOT NULL,   -- store as unix epoch millis
      is_favourite INTEGER NOT NULL DEFAULT 0
    );
  `);

  // OPTIONAL: seed data only if table is empty
  const first = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM snippets`
  );
  if ((first?.count ?? 0) === 0) {
    await db.execAsync(`
      INSERT INTO snippets (id,title,language,code,tags,create_at,is_favourite)
      VALUES ('1','Debounce hook','TypeScript','function useDebounce(){...}','hooks,react,utils', ${Date.now() - 2*60*60*1000}, 1);
      INSERT INTO snippets (id,title,language,code,tags,create_at,is_favourite)
      VALUES ('2','Flatten nested array','JavaScript','const flatten = ...','array,functional', ${Date.now() - 24*60*60*1000}, 0);
      INSERT INTO snippets (id,title,language,code,tags,create_at,is_favourite)
      VALUES ('3','SQLite init script','Shell','sqlite3 mydb.db < schema.sql ...','db,setup', ${Date.now() - 3*24*60*60*1000}, 0);
    `);
  }
}