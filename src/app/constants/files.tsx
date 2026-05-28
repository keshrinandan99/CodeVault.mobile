 
type FileType = 'all' | 'snippets' | 'images' | 'exports';
 
interface FileRow {
  id: number;
  name: string;
  uri: string;
  mime_type: string | null;
  size_bytes: number;
  snippet_id: number | null;
  folder: string | null;
  created_at: string;
}
 
interface FolderDef {
  key: string;
  label: string;
  icon: string;
  path: string;
}
 
export const FOLDERS: FolderDef[] = [
    { key: 'snippets',    label: 'Snippets',     icon: 'code-braces',     path: 'codevault/snippets/'    },
    { key: 'attachments', label: 'Attachments',  icon: 'image-multiple',  path: 'codevault/attachments/' },
    { key: 'exports',     label: 'Exports',      icon: 'export-variant',  path: 'codevault/exports/'     },
    { key: 'templates',   label: 'Templates',    icon: 'view-grid-plus',  path: 'codevault/templates/'   },
  ];

  export const SEGMENT_TABS: { key: FileType; label: string }[] = [
    { key: 'all',      label: 'All files' },
    { key: 'snippets', label: 'Snippets'  },
    { key: 'images',   label: 'Images'    },
    { key: 'exports',  label: 'Exports'   },
  ];
   
  export const EMPTY_MESSAGES: Record<string, { title: string; body: string; icon: string }> = {
    templates:  { icon: 'view-grid-plus', title: 'No templates yet',           body: 'Download a template to get started.'               },
    images:     { icon: 'image-off',      title: 'No images',                  body: 'Screenshots attached to snippets will appear here.' },
    exports:    { icon: 'export-off',     title: 'Nothing exported yet',       body: 'Export a snippet to see files here.'                },
    snippets:   { icon: 'code-off',       title: 'No code snippets',           body: 'Save a snippet to see its files here.'              },
    all:        { icon: 'folder-open',    title: 'No files yet',               body: 'Import a file or export a snippet to get started.'  },
  };