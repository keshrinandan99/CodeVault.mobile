import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import type { Snippet } from '@/types/snippet';
import { theme } from '@/constants/theme';
import { mapRowToSnippet, SNIPPET_SELECT, type DbSnippetRow } from '@/utils/snippetDb';
import { toggleFavoriteInDb } from '@/utils/favourites';
import { duplicateSnippet, deleteSnippetCascade } from '@/utils/snippetActions';
import { SnippetDetailHeader } from '@/components/snippet-detail/SnippetDetailHeader';
import { SnippetMetaSection } from '@/components/snippet-detail/SnippetMetaSection';
import { CodeViewer } from '@/components/snippet-detail/CodeViewer';
import { AiExplanationPanel } from '@/components/snippet-detail/AiExplanationPanel';
import { AttachmentsGrid } from '@/components/snippet-detail/AttachmentsGrid';
import { ExportShareSection } from '@/components/snippet-detail/ExportShareSection';
import { ActionSheetModal } from '@/components/snippet-detail/ActionSheetModal';
import { Toast } from '@/components/snippet-detail/Toast';

const SnippetDetail = () => {
  const db = useSQLiteContext();
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    actionLabel?: string;
    onAction?: () => void;
  } | null>(null);

  const loadSnippet = useCallback(async () => {
    if (!id) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const row = await db.getFirstAsync<DbSnippetRow>(
        `SELECT ${SNIPPET_SELECT} FROM snippets WHERE id = ?`,
        [id]
      );
      if (!row) {
        setNotFound(true);
        setSnippet(null);
      } else {
        setSnippet(mapRowToSnippet(row));
        setNotFound(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [db, id]);

  useFocusEffect(
    useCallback(() => {
      loadSnippet();
    }, [loadSnippet])
  );

  const showToast = (
    message: string,
    actionLabel?: string,
    onAction?: () => void
  ) => {
    setToast({ message, actionLabel, onAction });
  };

  const handleToggleFavourite = () => {
    if (!snippet) return;
    const next = !snippet.is_favourite;
    setSnippet({ ...snippet, is_favourite: next });
    toggleFavoriteInDb(db, snippet.id, snippet.is_favourite).catch(() => {
      setSnippet({ ...snippet, is_favourite: snippet.is_favourite });
    });
  };

  const handleDuplicate = async () => {
    if (!id) return;
    const row = await db.getFirstAsync<DbSnippetRow>(
      `SELECT ${SNIPPET_SELECT} FROM snippets WHERE id = ?`,
      [id]
    );
    if (!row) return;
    const newId = await duplicateSnippet(db, row);
    router.replace(`/snippets/${newId}`);
  };

  const handleDelete = () => {
    Alert.alert('Delete snippet', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!id) return;
          await deleteSnippetCascade(db, id);
          router.back();
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.textPrimary} />
        </View>
      </SafeAreaView>
    );
  }

  if (notFound || !snippet) {
    return (
      <SafeAreaView style={styles.container}>
        <SnippetDetailHeader
          isFavourite={false}
          onToggleFavourite={() => {}}
          onEdit={() => router.back()}
          onMenu={() => {}}
        />
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>Snippet not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <SnippetDetailHeader
        isFavourite={snippet.is_favourite}
        onToggleFavourite={handleToggleFavourite}
        onEdit={() => router.push(`/snippets/edit/${snippet.id}`)}
        onMenu={() => setMenuOpen(true)}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SnippetMetaSection snippet={snippet} />
        <View style={styles.divider} />
        <CodeViewer
          code={snippet.code}
          language={snippet.language}
          onCopied={() => showToast('Copied!')}
        />
        <AiExplanationPanel snippet={snippet} />
        <AttachmentsGrid snippetId={snippet.id} />
        <ExportShareSection snippet={snippet} onToast={showToast} />
      </ScrollView>

      <ActionSheetModal
        visible={menuOpen}
        options={[
          { label: 'Duplicate', onPress: handleDuplicate },
          { label: 'Delete', destructive: true, onPress: handleDelete },
        ]}
        onClose={() => setMenuOpen(false)}
      />

      <Toast
        visible={!!toast}
        message={toast?.message ?? ''}
        actionLabel={toast?.actionLabel}
        onAction={toast?.onAction}
        onHide={() => setToast(null)}
      />
    </SafeAreaView>
  );
};

export default SnippetDetail;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bgPrimary },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: theme.textPrimary },
  divider: {
    borderTopWidth: 0.5,
    borderTopColor: theme.borderTertiary,
    marginHorizontal: 16,
    marginBottom: 10,
  },
});
