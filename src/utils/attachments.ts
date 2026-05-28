import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
import type { SQLiteDatabase } from 'expo-sqlite';
import { ensureCodevaultDirs, getAttachmentsDir, fileSize } from '@/utils/paths';
import { insertFile } from '@/utils/filesDb';

function uniqueName(original: string): string {
  const safe = original.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${Date.now()}-${safe}`;
}

async function copyToAttachments(
  sourceUri: string,
  name: string,
  mimeType: string | null
): Promise<{ uri: string; name: string; size: number }> {
  ensureCodevaultDirs();
  const destName = uniqueName(name);
  const dest = new File(getAttachmentsDir(), destName);
  const src = new File(sourceUri);
  await src.copy(dest);
  return { uri: dest.uri, name: destName, size: fileSize(dest.uri) };
}

export async function addAttachmentFromUri(
  db: SQLiteDatabase,
  snippetId: string,
  sourceUri: string,
  name: string,
  mimeType: string | null
): Promise<void> {
  const copied = await copyToAttachments(sourceUri, name, mimeType);
  await insertFile(db, {
    name,
    uri: copied.uri,
    mime_type: mimeType,
    size_bytes: copied.size,
    snippet_id: snippetId,
    folder: 'attachments',
    created_at: Date.now(),
  });
}

export async function pickFromCamera(db: SQLiteDatabase, snippetId: string): Promise<boolean> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return false;
  const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
  if (result.canceled || !result.assets[0]) return false;
  const asset = result.assets[0];
  await addAttachmentFromUri(
    db,
    snippetId,
    asset.uri,
    asset.fileName ?? 'photo.jpg',
    asset.mimeType ?? 'image/jpeg'
  );
  return true;
}

export async function pickFromLibrary(db: SQLiteDatabase, snippetId: string): Promise<boolean> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return false;
  const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
  if (result.canceled || !result.assets[0]) return false;
  const asset = result.assets[0];
  await addAttachmentFromUri(
    db,
    snippetId,
    asset.uri,
    asset.fileName ?? 'image.jpg',
    asset.mimeType ?? 'image/jpeg'
  );
  return true;
}

export async function pickDocument(db: SQLiteDatabase, snippetId: string): Promise<boolean> {
  const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
  if (result.canceled || !result.assets?.[0]) return false;
  const asset = result.assets[0];
  await addAttachmentFromUri(
    db,
    snippetId,
    asset.uri,
    asset.name,
    asset.mimeType ?? null
  );
  return true;
}

export function isImageMime(mime: string | null, name: string): boolean {
  if (mime?.startsWith('image/')) return true;
  return /\.(png|jpe?g|gif|webp|heic)$/i.test(name);
}
