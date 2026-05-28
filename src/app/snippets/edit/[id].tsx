import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import React, { useCallback, useState } from 'react';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { SnippetForm, type SnippetFormValues } from '@/components/SnippetForm';
import { theme } from '@/constants/theme';
import { mapRowToSnippet, parseTagsInput, tagsToString, type DbSnippetRow } from '@/utils/snippetDb';

const EditSnippet = () => {
  const db = useSQLiteContext();
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const [initial, setInitial] = useState<SnippetFormValues | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const loadSnippet = useCallback(async () => {
    if (!id) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const row = await db.getFirstAsync<DbSnippetRow>(
        `SELECT id, title, language, code, tags, create_at, updated_at, is_favourite
         FROM snippets WHERE id = ?`,
        [id]
      );

      if (!row) {
        setNotFound(true);
        setInitial(null);
      } else {
        const snippet = mapRowToSnippet(row);
        setInitial({
          title: snippet.title,
          language: snippet.language,
          code: snippet.code,
          tags: tagsToString(snippet.tag),
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [db, id]);

  useFocusEffect(
    useCallback(() => {
      void loadSnippet();
    }, [loadSnippet])
  );

  const handleSubmit = async (values: SnippetFormValues) => {
    if (!id) return;

    const tags = parseTagsInput(values.tags).join(',');
    await db.runAsync(
      `UPDATE snippets SET title = ?, language = ?, code = ?, tags = ?, updated_at = ? WHERE id = ?`,
      [values.title, values.language, values.code, tags, Date.now(), id]
    );
    router.back();
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

  if (notFound || !initial) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>Snippet not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit snippet</Text>
        <View style={styles.headerSpacer} />
      </View>

      <SnippetForm
        initial={initial}
        submitLabel="Save changes"
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </SafeAreaView>
  );
};

export default EditSnippet;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bgPrimary },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: theme.textPrimary,
    textAlign: 'center',
  },
  headerSpacer: { width: 36 },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.bgSecondary,
    borderWidth: 0.5,
    borderColor: theme.borderTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: theme.textPrimary },
});
