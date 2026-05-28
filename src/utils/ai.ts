import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import type { SQLiteDatabase } from 'expo-sqlite';

export const AI_API_KEY_STORAGE = 'ai_api_key';
export const ANTHROPIC_MODEL = 'claude-sonnet-4-20250514';

export type AiExplanationKind = 'explain' | 'summarize' | 'improve';

export type CachedExplanation = {
  snippet_id: string;
  kind: AiExplanationKind;
  content: string;
  code_hash: string;
  model: string | null;
  created_at: number;
};

const PROMPTS: Record<AiExplanationKind, (language: string) => string> = {
  explain: (language) =>
    `Explain the following ${language} code in plain English. Walk through what it does step by step. Be concise but clear.`,
  summarize: (language) =>
    `Summarize the following ${language} code in one short paragraph. Focus on purpose and behavior.`,
  improve: (language) =>
    `Review the following ${language} code and suggest specific improvements. Return a bullet list (one suggestion per line, starting with "- ").`,
};

export async function hashCode(code: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, code);
}

export async function getApiKey(): Promise<string | null> {
  return SecureStore.getItemAsync(AI_API_KEY_STORAGE);
}

export async function getCachedExplanation(
  db: SQLiteDatabase,
  snippetId: string,
  kind: AiExplanationKind
): Promise<CachedExplanation | null> {
  return db.getFirstAsync<CachedExplanation>(
    `SELECT snippet_id, kind, content, code_hash, model, created_at
     FROM ai_explanations WHERE snippet_id = ? AND kind = ?`,
    [snippetId, kind]
  );
}

export async function getAllCachedForSnippet(
  db: SQLiteDatabase,
  snippetId: string
): Promise<CachedExplanation[]> {
  return db.getAllAsync<CachedExplanation>(
    `SELECT snippet_id, kind, content, code_hash, model, created_at
     FROM ai_explanations WHERE snippet_id = ?`,
    [snippetId]
  );
}

export async function saveCachedExplanation(
  db: SQLiteDatabase,
  snippetId: string,
  kind: AiExplanationKind,
  content: string,
  codeHash: string,
  model: string
): Promise<void> {
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO ai_explanations (snippet_id, kind, content, code_hash, model, created_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(snippet_id, kind) DO UPDATE SET
       content = excluded.content,
       code_hash = excluded.code_hash,
       model = excluded.model,
       created_at = excluded.created_at`,
    [snippetId, kind, content, codeHash, model, now]
  );
}

export async function deleteAiForSnippet(db: SQLiteDatabase, snippetId: string): Promise<void> {
  await db.runAsync(`DELETE FROM ai_explanations WHERE snippet_id = ?`, [snippetId]);
}

export function parseImproveBullets(content: string): string[] {
  return content
    .split('\n')
    .map((l) => l.replace(/^[-*•]\s*/, '').trim())
    .filter(Boolean);
}

export async function callAnthropic(
  kind: AiExplanationKind,
  code: string,
  language: string
): Promise<string> {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error('NO_API_KEY');
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `${PROMPTS[kind](language)}\n\n\`\`\`${language.toLowerCase()}\n${code}\n\`\`\``,
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || `API error ${res.status}`);
  }

  const data = (await res.json()) as {
    content?: { type: string; text?: string }[];
  };
  const text = data.content?.find((c) => c.type === 'text')?.text?.trim();
  if (!text) throw new Error('Empty response from AI');
  return text;
}
