export type FileType = 'all' | 'snippets' | 'images' | 'exports';

export interface FileRow {
  id: number;
  name: string;
  uri: string;
  mime_type: string | null;
  size_bytes: number;
  snippet_id: string | null;
  folder: string | null;
  created_at: number;
}

export interface FolderDef {
  key: string;
  label: string;
  icon: string;
  path: string;
}
