import React, { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import type { FileRow } from '@/types/files';
import { theme } from '@/constants/theme';
import { getFilesForSnippet, deleteFileRow } from '@/utils/filesDb';
import {
  isImageMime,
  pickDocument,
  pickFromCamera,
  pickFromLibrary,
} from '@/utils/attachments';
import { shareFileUri } from '@/utils/share';
import { ActionSheetModal, type ActionSheetOption } from './ActionSheetModal';
import { File } from 'expo-file-system';

type AttachmentsGridProps = {
  snippetId: string;
  onChanged?: () => void;
};

export function AttachmentsGrid({ snippetId, onChanged }: AttachmentsGridProps) {
  const db = useSQLiteContext();
  const [files, setFiles] = useState<FileRow[]>([]);
  const [actionSheet, setActionSheet] = useState<FileRow | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewText, setPreviewText] = useState<string | null>(null);

  const load = useCallback(async () => {
    const rows = await getFilesForSnippet(db, snippetId, 'attachments');
    setFiles(rows);
  }, [db, snippetId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const showAddPicker = () => {
    Alert.alert('Add attachment', 'Choose a source', [
      { text: 'Camera', onPress: async () => { await pickFromCamera(db, snippetId); await load(); onChanged?.(); } },
      { text: 'Photo library', onPress: async () => { await pickFromLibrary(db, snippetId); await load(); onChanged?.(); } },
      { text: 'File picker', onPress: async () => { await pickDocument(db, snippetId); await load(); onChanged?.(); } },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const attachmentActions = (file: FileRow): ActionSheetOption[] => [
    {
      label: 'View',
      onPress: async () => {
        if (isImageMime(file.mime_type, file.name)) {
          setPreviewUri(file.uri);
        } else {
          try {
            const f = new File(file.uri);
            const text = f.exists ? await f.text() : 'Unable to read file';
            setPreviewText(text.slice(0, 8000));
          } catch {
            setPreviewText('Unable to preview this file.');
          }
        }
      },
    },
    {
      label: 'Share',
      onPress: () => shareFileUri(file.uri, file.mime_type ?? undefined),
    },
    {
      label: 'Delete',
      destructive: true,
      onPress: async () => {
        await deleteFileRow(db, file.id);
        await load();
        onChanged?.();
      },
    },
  ];

  const ext = (name: string) => {
    const i = name.lastIndexOf('.');
    return i >= 0 ? name.slice(i + 1) : 'file';
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.sectionHdr}>
        <Text style={styles.secLbl}>ATTACHMENTS</Text>
        <TouchableOpacity style={styles.secAct} onPress={showAddPicker}>
          <Ionicons name="add" size={12} color={theme.textInfo} />
          <Text style={styles.secActText}>add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        {files.map((file) => (
          <TouchableOpacity
            key={file.id}
            style={styles.thumb}
            onLongPress={() => setActionSheet(file)}
          >
            {isImageMime(file.mime_type, file.name) ? (
              <Image source={{ uri: file.uri }} style={styles.thumbImage} />
            ) : (
              <Ionicons name="document-text-outline" size={24} color={theme.textTertiary} />
            )}
            <Text style={styles.thumbName} numberOfLines={1}>
              {file.name}
            </Text>
            {!isImageMime(file.mime_type, file.name) ? (
              <Text style={styles.ext}>{ext(file.name)}</Text>
            ) : null}
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={[styles.thumb, styles.addThumb]} onPress={showAddPicker}>
          <Ionicons name="add" size={22} color={theme.textTertiary} />
          <Text style={styles.addLabel}>attach</Text>
        </TouchableOpacity>
      </View>

      <ActionSheetModal
        visible={!!actionSheet}
        title={actionSheet?.name}
        options={actionSheet ? attachmentActions(actionSheet) : []}
        onClose={() => setActionSheet(null)}
      />

      <Modal visible={!!previewUri} transparent animationType="fade" onRequestClose={() => setPreviewUri(null)}>
        <TouchableOpacity style={styles.previewBackdrop} activeOpacity={1} onPress={() => setPreviewUri(null)}>
          {previewUri ? <Image source={{ uri: previewUri }} style={styles.previewImage} resizeMode="contain" /> : null}
        </TouchableOpacity>
      </Modal>

      <Modal visible={previewText !== null} animationType="slide" onRequestClose={() => setPreviewText(null)}>
        <View style={styles.textPreview}>
          <TouchableOpacity style={styles.closePreview} onPress={() => setPreviewText(null)}>
            <Ionicons name="close" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.previewTextContent}>{previewText}</Text>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 10 },
  sectionHdr: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  secLbl: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.textSecondary,
    letterSpacing: 0.5,
  },
  secAct: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  secActText: { fontSize: 12, color: theme.textInfo, fontWeight: '500' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
  },
  thumb: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: theme.bgSecondary,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: theme.borderTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    overflow: 'hidden',
  },
  addThumb: {
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  thumbImage: { width: '100%', height: '60%', borderRadius: 4 },
  thumbName: {
    fontSize: 9,
    color: theme.textTertiary,
    marginTop: 4,
    width: '100%',
    textAlign: 'center',
  },
  ext: { fontSize: 8, color: theme.textTertiary },
  addLabel: { fontSize: 9, color: theme.textTertiary, marginTop: 4 },
  previewBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    padding: 16,
  },
  previewImage: { width: '100%', height: '80%' },
  textPreview: { flex: 1, backgroundColor: theme.bgPrimary, padding: 16, paddingTop: 48 },
  closePreview: { alignSelf: 'flex-end', marginBottom: 12 },
  previewTextContent: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: theme.textSecondary,
    lineHeight: 18,
  },
});
