import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import type { Snippet } from '@/types/snippet';

const theme = {
  bgPrimary: '#FFFFFF',
  bgSecondary: '#F8F9FA',
  textPrimary: '#111827',
  textSecondary: '#4B5563',
  textTertiary: '#9CA3AF',
  borderSecondary: '#E5E7EB',
  borderTertiary: '#F3F4F6',
  heartActive: '#E24B4A',
};

const getLanguageStyle = (lang: string) => {
  const styles: Record<string, { bg: string; text: string }> = {
    JavaScript: { bg: '#FAEEDA', text: '#633806' },
    Python: { bg: '#E1F5EE', text: '#085041' },
    TypeScript: { bg: '#E6F1FB', text: '#0C447C' },
    Shell: { bg: '#F1EFE8', text: '#444441' },
  };
  return styles[lang] || { bg: '#F3F4F6', text: '#374151' };
};

type SnippetCardProps = {
  item: Snippet;
  onPress?: (id: string) => void;
  onToggleFavourite?: (id: string) => void;
};

export const SnippetCard = ({ item, onPress, onToggleFavourite }: SnippetCardProps) => {
  const langStyle = getLanguageStyle(item.language);

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={onPress ? () => onPress(item.id) : undefined}
    >
      <View style={styles.cardTop}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <TouchableOpacity
          onPress={onToggleFavourite ? () => onToggleFavourite(item.id) : undefined}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={item.is_favourite ? 'heart' : 'heart-outline'}
            size={18}
            color={item.is_favourite ? theme.heartActive : theme.textTertiary}
          />
        </TouchableOpacity>
      </View>

      <View style={{ alignSelf: 'flex-start' }}>
        <View style={[styles.langBadge, { backgroundColor: langStyle.bg }]}>
          <Text style={[styles.langBadgeText, { color: langStyle.text }]}>{item.language}</Text>
        </View>
      </View>

      <Text style={styles.codePreview} numberOfLines={1}>
        {item.code}
      </Text>

      <View style={styles.cardTags}>
        {item.tag.slice(0, 3).map((t) => (
          <View key={t} style={styles.tag}>
            <Text style={styles.tagText}>{t}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.cardDate}>{formatDistanceToNow(item.create_at, { addSuffix: true })}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: theme.borderSecondary,
    borderRadius: 12,
    padding: 14,
    backgroundColor: theme.bgPrimary,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: { fontSize: 15, fontWeight: '600', color: theme.textPrimary },
  langBadge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, marginBottom: 8 },
  langBadgeText: { fontSize: 11, fontWeight: '600' },
  codePreview: {
    backgroundColor: theme.bgSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    color: theme.textSecondary,
    padding: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  cardTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  tag: {
    backgroundColor: theme.bgSecondary,
    borderWidth: 0.5,
    borderColor: theme.borderSecondary,
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  tagText: { fontSize: 11, color: theme.textTertiary },
  cardDate: { fontSize: 11, color: theme.textTertiary, marginTop: 10 },
});