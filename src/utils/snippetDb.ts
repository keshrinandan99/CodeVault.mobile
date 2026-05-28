import type { Snippet } from '@/types/snippet';

export type DbSnippetRow = {
  id: string;
  title: string;
  language: string;
  code: string;
  tags: string;
  create_at: number;
  updated_at?: number | null;
  is_favourite: number;
};

export const SNIPPET_SELECT =
  'id, title, language, code, tags, create_at, updated_at, is_favourite';

export const mapRowToSnippet = (row: DbSnippetRow): Snippet => ({
  id: row.id,
  title: row.title,
  language: row.language,
  code: row.code,
  tag: (row.tags ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  create_at: new Date(row.create_at),
  updated_at: row.updated_at != null ? new Date(row.updated_at) : undefined,
  is_favourite: row.is_favourite === 1,
  is_pinned: 0,
});

export const tagsToString = (tags: string[]) => tags.join(', ');

export const parseTagsInput = (input: string) =>
  input
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
