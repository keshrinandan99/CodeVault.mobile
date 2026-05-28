import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { Snippet } from '@/types/snippet';

export async function shareSnippetAsText(snippet: Snippet): Promise<void> {
  const body = `${snippet.title}\n\n${snippet.code}`;
  const dest = new File(Paths.cache, `share-${snippet.id}-${Date.now()}.txt`);
  if (!dest.exists) dest.create();
  dest.write(body);
  await Sharing.shareAsync(dest.uri, {
    mimeType: 'text/plain',
    dialogTitle: 'Share snippet',
  });
}

export async function shareFileUri(uri: string, mimeType?: string): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (!available) return;
  await Sharing.shareAsync(uri, mimeType ? { mimeType } : undefined);
}
