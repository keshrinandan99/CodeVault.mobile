import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, formatDistanceToNow } from 'date-fns';
import { router } from 'expo-router';
import type { Snippet } from '@/types/snippet';
import { getLanguageStyle, theme } from '@/constants/theme';

type SnippetMetaSectionProps = {
  snippet: Snippet;
};

export function SnippetMetaSection({ snippet }: SnippetMetaSectionProps) {
  const langStyle = getLanguageStyle(snippet.language);
  const editedAt = snippet.updated_at ?? snippet.create_at;

  return (
    <View style={styles.meta}>
      <Text style={styles.snippetTitle}>{snippet.title}</Text>
      <View style={styles.metaRow}>
        <View style={[styles.badge, { backgroundColor: langStyle.bg }]}>
          <Ionicons name="code-slash" size={10} color={langStyle.text} />
          <Text style={[styles.badgeText, { color: langStyle.text }]}>{snippet.language}</Text>
        </View>
        {snippet.tag.map((tag) => (
          <TouchableOpacity
            key={tag}
            style={styles.tag}
            onPress={() =>
              router.push({ pathname: '/(tabs)/home', params: { filterTag: tag } })
            }
          >
            <Text style={styles.tagText}>{tag}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.dates}>
        <Text style={styles.date}>
          <Ionicons name="calendar-outline" size={10} color={theme.textTertiary} /> Created{' '}
          {format(snippet.create_at, 'MMM d, yyyy')}
        </Text>
        <Text style={styles.date}>
          <Ionicons name="time-outline" size={10} color={theme.textTertiary} /> Edited{' '}
          {formatDistanceToNow(editedAt, { addSuffix: true })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  meta: { paddingHorizontal: 16, paddingBottom: 10 },
  snippetTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.textPrimary,
    lineHeight: 26,
    marginBottom: 8,
  },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 8 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  badgeText: { fontSize: 11, fontWeight: '600' },
  tag: {
    backgroundColor: theme.bgSecondary,
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderWidth: 0.5,
    borderColor: theme.borderTertiary,
  },
  tagText: { fontSize: 11, color: theme.textTertiary },
  dates: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  date: { fontSize: 11, color: theme.textTertiary },
});
